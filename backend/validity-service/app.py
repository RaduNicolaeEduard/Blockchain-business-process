from flask import Flask, request, jsonify
import PyPDF2
import pdfreader
import tempfile
import json
app = Flask(__name__)

@app.route('/get_signatures', methods=['POST'])
def get_signatures():
    path_to_check = request.json["path"]
    fd = open(path_to_check, "rb")
    doc = pdfreader.PDFDocument(fd)
    pdfreader.PDFDocument.pages
    signatures_on_document = []
    for doc in doc.root['AcroForm']['Fields']:
        if doc["FT"] == "Sig":
            signatures_on_document.append(doc["T"].decode('utf-8'))       
    fd.close()
    return signatures_on_document