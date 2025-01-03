# BanglaBot API Documentation

## 1. Convert Text
### Endpoint
`POST /api/convert`

### Request Headers
- `Content-Type: application/json`

### Request Body
```json
{
  "text": "ami banglay gan gai"
}
```

### Response Body
```json
{
  "convertedBangla": "আমি বাংলায় গান গাই"
}
```

## 2. Generate Metadata
### Endpoint
`POST /api/generate-metadata`

### Request Headers
- `Content-Type: application/json`

### Request Body
```json
{
  "text": "বাংলাদেশের জাতীয় ফুল শাপলা। এটি দেশের সংস্কৃতি ও ঐতিহ্যের প্রতীক।"
}
```

### Response Body
```json
{
  "title": "বাংলাদেশের জাতীয় ফুল",
  "caption": "শাপলা: বাংলাদেশের ঐতিহ্যবাহী জাতীয় ফুল",
  "file_name": "bangladesh-national-flower"
}
```

## 3. Generate PDF Metadata
### Endpoint
`POST /api/generate_pdf`

### Request Headers
- `Content-Type: application/json`

### Request Body
```json
{
  "text": "বাংলাদেশের জাতীয় ফুল শাপলা।",
  "email": "user@example.com"
}
```

### Response Body
```json
{
  "success": true,
  "message": "PDF metadata saved successfully",
  "data": {
    "email": "user@example.com",
    "text": "বাংলাদেশের জাতীয় ফুল শাপলা।",
    "title": "বাংলাদেশের জাতীয় ফুল",
    "caption": "শাপলা: বাংলাদেশের ঐতিহ্যবাহী জাতীয় ফুল",
    "filename": "bangladesh-national-flower",
    "date": "2025-01-03T12:34:56.789Z"
  }
}
```

## 4. Convert Image
### Endpoint
`POST /api/convert-image`

### Request Headers
- `Content-Type: multipart/form-data`

### Request Body
- Form Data:
  - `image`: Image file (JPEG/PNG, max 5MB)

### Response Body
```json
{
  "originalText": "ami banglay gan gai",
  "convertedText": "আমি বাংলায় গান গাই"
}
```

### Error Responses
For all endpoints:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common error status codes:
- `400`: Bad Request (invalid input)
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error