from kafka import KafkaConsumer, KafkaAdminClient
from kafka.admin import NewTopic
from pyhanko import stamp
from pyhanko.pdf_utils import text, images
from pyhanko.pdf_utils.font import opentype
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import fields, signers
import OpenSSL
import json
import tempfile
import os
import shutil
def create_topic_if_not_exists(admin_client, topic, partitions=1, replication_factor=1):
    topic_list = [NewTopic(name=topic, num_partitions=partitions, replication_factor=replication_factor)]
    admin_client.create_topics(topic_list)

def kafka_consumer():
    # Kafka broker details
    bootstrap_servers = 'localhost:9092'
    topic = 'sign-queue'

    # Create a Kafka consumer instance
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        enable_auto_commit=True,
        value_deserializer=lambda x: x.decode('utf-8')
    )

    try:
        for message in consumer:
            # decode json dumps
            print("message received")
            data = json.loads(message.value)
            privateKey = data.get('privateKey')
            publickey = data.get('publickey')
            pdfLocation = data.get('pdfLocation')
            userid = data.get('userid')
            print(pdfLocation)
            cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, publickey)
            key = OpenSSL.crypto.load_privatekey(OpenSSL.crypto.FILETYPE_PEM, privateKey)
            p12 = OpenSSL.crypto.PKCS12()
            # wirte p12 temporarily to the disk
            f = tempfile.NamedTemporaryFile(delete=False)
            with open(f.name, 'wb') as p12_file:
                p12.set_certificate(cert)
                p12.set_privatekey(key)
                p12_data = p12.export()
                p12_file.write(p12_data)
            singer = signers.SimpleSigner.load_pkcs12(pfx_file=f.name)
            f.close()
            os.unlink(f.name)
            with open(pdfLocation, 'rb') as inf:
                print(inf)
                w = IncrementalPdfFileWriter(inf)
                print("pdf signed")
                meta = signers.PdfSignatureMetadata(field_name=userid)
                pdf_signer = signers.PdfSigner(
                    meta, signer=singer
                )
                f = tempfile.NamedTemporaryFile(delete=False)
                with open(f.name, 'wb') as outf:
                    pdf_signer.sign_pdf(w, output=outf)
                # os move file
                shutil.copy(f.name, pdfLocation)
                os.remove(f.name)
                os.rename(f.name, pdfLocation)
                f.close()


    except KeyboardInterrupt:
        pass

    finally:
        # Close the consumer to release resources
        consumer.close()
bootstrap_servers = 'localhost:9092'
topic = 'sign-queue'
admin_client = KafkaAdminClient(bootstrap_servers=bootstrap_servers)
try:
    create_topic_if_not_exists(admin_client, topic)
    print("Topic sign-queue created")
except Exception as e:
    print("Topic sign-queue already exists")


# Start the Kafka consumer
kafka_consumer()