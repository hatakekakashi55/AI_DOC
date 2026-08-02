# AI DOC 🚀 — Intelligent Document Workspace

[![Live Demo](https://img.shields.io/badge/Live_Demo-aidoc--codedth.vercel.app-blue?style=for-the-badge&logo=vercel)](https://aidoc-codedth.vercel.app)
[![GitHub License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

An intelligent, full-stack Document Intelligence platform that allows users to upload multi-format documents (`.pdf`, `.docx`, `.txt`) and chat with them in real-time using **Retrieval-Augmented Generation (RAG)**, **Classical NLP (TF-IDF & Cosine Similarity)**, and **Google Gemini 2.5 Flash LLM**.

---

## 🌐 Live Demo
👉 **[https://aidoc-codedth.vercel.app](https://aidoc-codedth.vercel.app)**

---

## ✨ Features

- 📄 **Multi-Format Document Parsing**: Instant text extraction from `.pdf`, `.docx`, and `.txt` files.
- 🔍 **Pure-Python RAG Engine**: Sliding-window text chunker (300 words with 40-word overlap) with mathematical TF-IDF & Cosine Similarity vector indexing.
- ⚡ **Google Gemini 2.5 Flash LLM**: Instant, grounded answers backed by a resilient serverless fallback chain.
- 🎨 **Minimalist Dark/Light UI**: Built with React, Vite, Tailwind CSS v4, Framer Motion, and a built-in Markdown renderer.
- ⚡ **Vercel Serverless Ready**: Full-stack deployment support with Python API functions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, Python 3.12, PyPDF2, Zipfile, Google GenAI SDK.
- **Deployment**: Vercel (Static Frontend + Python Serverless API).

---

## 💻 Local Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows
pip install -r requirements.txt
python main.py
```
*Backend runs at `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 📜 License
Licensed under the [MIT License](LICENSE).
