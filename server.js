import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
const port = 5001;

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

        fs.unlinkSync(imagePath);
        
        res.json({ text });
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
</head>
<body>
    <h2>Ứng dụng OCR đơn giản</h2>
    <input type="file" id="imageInput" accept="image/*">
    <button onclick="uploadImage()">Nhận diện văn bản</button>
    <p id="result"></p>

    <script>
        async function uploadImage() {
            const fileInput = document.getElementById("imageInput");
            const formData = new FormData();
            formData.append("image", fileInput.files[0]);

            const response = await fetch("http://localhost:5001/upload", {
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