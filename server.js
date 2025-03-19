import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
const port = 5002;

app.use(cors());
app.use(express.static("public"));

if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
}

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const imagePath = req.file.path;
        
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            "eng", 
            { logger: m => console.log(m) } 
        );

        const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
        
        fs.unlinkSync(imagePath);
        
        res.json({ text, image: `data:image/png;base64,${imageBase64}` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xử lý OCR" });
    }
});

app.listen(port, () => {
    console.log(`Server chạy tại http://localhost:${port}`);
});

const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCR App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f4f4f4;
            text-align: center;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 80%;
            max-width: 600px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .preview {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-top: 20px;
        }
        .preview img {
            max-width: 45%;
            border-radius: 5px;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        }
        .preview p {
            width: 45%;
            text-align: left;
            padding: 10px;
            background: #e9ecef;
            border-radius: 5px;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            word-wrap: break-word;
        }
        input {
            margin: 10px 0;
        }
        button {
            padding: 10px 20px;
            background: #007BFF;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Ứng dụng OCR</h2>
        <input type="file" id="imageInput" accept="image/*">
        <button onclick="uploadImage()">Nhận diện văn bản</button>
        <div class="preview" id="previewContainer" style="display: none;">
            <img id="previewImage" src="" alt="Hình ảnh đã chọn">
            <p id="result"></p>
        </div>
    </div>

    <script>
        async function uploadImage() {
            const fileInput = document.getElementById("imageInput");
            if (!fileInput.files.length) {
                alert("Vui lòng chọn một hình ảnh.");
                return;
            }
            const formData = new FormData();
            formData.append("image", fileInput.files[0]);

            document.getElementById("result").innerText = "Đang xử lý...";
            document.getElementById("previewContainer").style.display = "flex";
            document.getElementById("previewImage").src = URL.createObjectURL(fileInput.files[0]);

            const response = await fetch("http://localhost:5002/upload", {
                method: "POST",
                body: formData
            });
            
            const result = await response.json();
            document.getElementById("result").innerText = result.text || "Lỗi OCR";
        }
    </script>
</body>
</html>
`;

fs.writeFileSync("public/index.html", htmlContent);
