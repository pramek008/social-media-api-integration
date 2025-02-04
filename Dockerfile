FROM node:18-alpine

WORKDIR /app

# Hanya salin file dependencies terlebih dahulu
COPY package*.json ./

# Gunakan --omit=dev jika tidak butuh dev dependencies (production)
RUN npm install --omit=dev

# Baru salin semua file setelah dependencies terinstall
COPY . .

# Buat folder uploads dengan permission yang benar
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 3000

# Build aplikasi sebelum dijalankan
RUN npm run build

# Jalankan aplikasi
CMD ["npm", "run", "dev"]
