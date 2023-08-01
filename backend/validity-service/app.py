from flask import Flask, request, jsonify
import re
import subprocess
app = Flask(__name__)

@app.route('/get_signatures', methods=['POST'])
def get_signatures():
    path_to_check = request.json["path"]
    proc = subprocess.Popen(["pdfsig", path_to_check], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = proc.communicate()
    out = out.decode('utf-8')
    pattern = r"Signature #(?P<id>\d+):\s+- Signature Field Name: (?P<field_name>\S+)\s+- Signer Certificate Common Name: (?P<common_name>\S+)\s+- Signer full Distinguished Name: (?P<full_name>.*?)\s+- Signing Time: (?P<signing_time>.*?)\s+- Signing Hash Algorithm: (?P<hash_algorithm>\S+)\s+- Signature Type: (?P<signature_type>\S+)\s+- Signed Ranges: (?P<signed_ranges>.*?)\s+- (?P<doc_signed>.*?)\s+- Signature Validation: (?P<signature_validation>.*?)\s+- Certificate Validation: (?P<certificate_validation>.*?)\s+(?=Signature #|$)"

    matches = re.findall(pattern, out, re.MULTILINE | re.DOTALL)

    signatures = [
        {
            'id': m[0],
            'field_name': m[1],
            'common_name': m[2],
            'full_name': m[3],
            'signing_time': m[4],
            'hash_algorithm': m[5],
            'signature_type': m[6],
            'signature_validation': m[9],
            'certificate_validation': m[10]
        }
        for m in matches
    ]

    return signatures

# app.run()