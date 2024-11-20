const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Lưu trữ trạng thái và liên kết
const linkData = {
    links: Array(5).fill({ 
        sourceLink: '', 
        destinationLink: '', 
        status: 'off' 
    })
};

// Đọc dữ liệu từ file JSON (nếu có)
function readLinkData() {
    try {
        const data = fs.readFileSync('links.json', 'utf8');
        linkData.links = JSON.parse(data);
    } catch (error) {
        console.log('Không tìm thấy file links.json');
    }
}

// Ghi dữ liệu vào file JSON
function writeLinkData() {
    fs.writeFileSync('links.json', JSON.stringify(linkData.links), 'utf8');
}

// Đọc dữ liệu khi khởi động
readLinkData();

// Route phục vụ trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route lưu link
app.post('/save-link', (req, res) => {
    const { sourceLink, destinationLink } = req.body;
    const rowIndex = linkData.links.findIndex(link => link.sourceLink === '');
    
    if (rowIndex !== -1) {
        linkData.links[rowIndex] = { 
            sourceLink, 
            destinationLink, 
            status: 'on' 
        };
        writeLinkData();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Không còn chỗ trống' });
    }
});

// Route bật/tắt trạng thái
app.post('/toggle-status', (req, res) => {
    const { rowIndex, status } = req.body;
    
    if (linkData.links[rowIndex]) {
        linkData.links[rowIndex].status = status;
        writeLinkData();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// Route kiểm tra trạng thái chuyển hướng
app.get('/status', (req, res) => {
    const redirectInfo = linkData.links.find(link => 
        link.sourceLink === req.headers.referer && link.status === 'on'
    );

    if (redirectInfo) {
        res.json({ 
            redirectEnabled: true, 
            destinationLink: redirectInfo.destinationLink 
        });
    } else {
        res.json({ redirectEnabled: false });
    }
});

// Chuyển hướng động
app.get('*', (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const matchingLink = linkData.links.find(link => 
        link.sourceLink === fullUrl && link.status === 'on'
    );

    if (matchingLink) {
        res.redirect(matchingLink.destinationLink);
    } else {
        res.status(404).send('Không tìm thấy trang');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
