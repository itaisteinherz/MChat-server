# Create a ssl folder and cd into it

cd ~/Development/Node.js/Projects/MChat\ Server/test/
rm -rf ssl
mkdir ssl
cd ssl

# Create certificates

openssl req -newkey rsa:2048 -new -nodes -sha256 -keyout key.pem -out csr.pem -subj /C=AU/ST=Some-State/O=Internet\ Widgits\ Pty\ Ltd
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt

# Rename certificates

openssl x509 -inform PEM -in server.crt > fullchain.pem
mv key.pem privkey.pem

# Delete unnecessary files

rm -f server.crt
rm -f csr.pem