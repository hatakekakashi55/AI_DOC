import re
import math
import os
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
import PyPDF2

# Global state for our pure-python Classical RAG engine
text_chunks = []
chunk_vectors = []
idf_scores = {}
vocabulary = set()

def tokenize(text):
    """Tokenization & Cleaning (Phase 1 Classical NLP)"""
    return re.findall(r'\b\w+\b', text.lower())

def chunk_text(text, chunk_size=300, overlap=40):
    """Text Chunking"""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks

def read_pdf(file_path):
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def read_docx(file_path):
    """Pure-Python DOCX text extractor (no external dependencies needed)"""
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            texts = [node.text for node in tree.iter() if node.tag.endswith('}t') and node.text]
            return "\n".join(texts)
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def read_txt(file_path):
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading TXT: {e}")
        return ""

def process_document(file_path):
    global text_chunks, chunk_vectors, idf_scores, vocabulary
    
    print(f"Processing document: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    
    # Extract text based on file format
    if ext == '.pdf':
        text = read_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        text = read_docx(file_path)
    else:
        text = read_txt(file_path)
        
    if not text.strip():
        print("No readable text found in document.")
        return
        
    # 2. Chunk text
    text_chunks = chunk_text(text)
    if not text_chunks:
        return
        
    # 3. Calculate Vocabulary & IDF (Inverse Document Frequency)
    num_docs = len(text_chunks)
    doc_freqs = Counter()
    tokenized_chunks = []
    
    for chunk in text_chunks:
        tokens = set(tokenize(chunk))
        tokenized_chunks.append(tokenize(chunk))
        for token in tokens:
            doc_freqs[token] += 1
            vocabulary.add(token)
            
    idf_scores = {token: math.log((num_docs + 1) / (freq + 1)) + 1 for token, freq in doc_freqs.items()}
    
    # 4. Compute TF-IDF Vectors for all chunks
    chunk_vectors = []
    for tokens in tokenized_chunks:
        tf = Counter(tokens)
        total_tokens = len(tokens) or 1
        vec = {token: (count / total_tokens) * idf_scores.get(token, 0) for token, count in tf.items()}
        chunk_vectors.append(vec)
        
    print(f"RAG Pipeline ready! Successfully indexed {len(text_chunks)} text chunks from {os.path.basename(file_path)}.")

def cosine_similarity(vec1, vec2):
    """Compute Cosine Similarity between two sparse vectors"""
    common_keys = set(vec1.keys()) & set(vec2.keys())
    dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
    
    norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)

def retrieve_context(query, k=3):
    global text_chunks, chunk_vectors, idf_scores
    if not text_chunks or not chunk_vectors:
        return ""
        
    # Vectorize Query
    query_tokens = tokenize(query)
    total_tokens = len(query_tokens) or 1
    query_tf = Counter(query_tokens)
    query_vec = {token: (count / total_tokens) * idf_scores.get(token, 0) for token, count in query_tf.items()}
    
    # Compute similarity with all document chunks
    scores = []
    for idx, vec in enumerate(chunk_vectors):
        sim = cosine_similarity(query_vec, vec)
        scores.append((sim, idx))
        
    # Sort by highest similarity
    scores.sort(key=lambda x: x[0], reverse=True)
    
    top_chunks = []
    for sim, idx in scores[:k]:
        if sim > 0:
            top_chunks.append(text_chunks[idx])
            
    # Fallback to top chunks if query vocabulary didn't direct-match
    if not top_chunks and text_chunks:
        top_chunks = text_chunks[:2]
        
    return "\n\n".join(top_chunks)
