from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/health':
            response = {'status': 'OK'}
        elif self.path.startswith('/products/'):
            product_id = self.path.split('/')[-1]
            products = {
                '1': {'productId': 1, 'name': 'Organic Tomatoes', 'status': 'Fresh', 'category': 'Vegetables', 'predictedPrice': 75},
                '2': {'productId': 2, 'name': 'Free Range Eggs', 'status': 'Available', 'category': 'Dairy', 'predictedPrice': 85},
                '3': {'productId': 3, 'name': 'Grass Fed Beef', 'status': 'Premium', 'category': 'Meat', 'predictedPrice': 650},
                '4': {'productId': 4, 'name': 'Organic Apples', 'status': 'Seasonal', 'category': 'Fruits', 'predictedPrice': 120}
            }
            response = products.get(product_id, {'error': 'Product not found'})
        else:
            response = {'error': 'Not found'}
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        if self.path == '/products':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'productId': 5,
                'transactionHash': '0xabc123def456'
            }
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 3001), APIHandler)
    print('Server running on http://localhost:3001')
    server.serve_forever()
