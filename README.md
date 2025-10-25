# Brev.ly - URL Shortener API

A modern URL shortener service built with Node.js, TypeScript, and PostgreSQL. This project provides a RESTful API for creating, managing, and tracking shortened URLs with analytics.

## 🚀 Features

- **URL Shortening**: Convert long URLs into short, manageable links
- **Custom Codes**: Option to provide custom short codes or auto-generate them
- **Access Tracking**: Monitor click counts and analytics for each shortened URL
- **CSV Export**: Export all links data to CSV format with cloud storage
- **Pagination**: Efficient data retrieval with pagination support
- **Redirection**: Fast URL redirection with 301 status codes
- **CRUD Operations**: Full create, read, update, delete functionality

## 🛠️ Tech Stack

### Backend
- **Node.js** with **TypeScript** - Runtime and type safety
- **Fastify** - High-performance web framework
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Zod** - Schema validation and type inference

### Cloud & Storage
- **Cloudflare R2** - Object storage for CSV exports
- **AWS SDK** - S3-compatible client for R2 integration

### DevOps
- **Docker** & **Docker Compose** - Containerization
- **Drizzle Kit** - Database migrations and schema management

### Development
- **tsx** - TypeScript execution for development
- **pino-pretty** - Structured logging

## 📋 API Endpoints

### Core Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/links` | Create a new shortened URL |
| `GET` | `/links` | List all links with pagination |
| `GET` | `/:code` | Redirect to original URL (increments counter) |
| `DELETE` | `/links/:id` | Delete a specific link |
| `POST` | `/links/export/csv` | Export all links to CSV |

### Request/Response Examples

#### Create Short URL
```bash
POST /links
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "code": "custom123" // optional
}
```

Response:
```json
{
  "id": 1,
  "shortUrl": "https://your-domain.com/custom123"
}
```

#### List Links
```bash
GET /links?page=1&pageSize=10
```

Response:
```json
[
  {
    "id": 1,
    "code": "custom123",
    "originalUrl": "https://example.com/very-long-url",
    "accessCount": 42,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "shortUrl": "https://your-domain.com/custom123"
  }
]
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use the provided Docker setup)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd server-node
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the database**
```bash
docker-compose up -d db
```

5. **Run database migrations**
```bash
npm run db:generate
npm run db:migrate
```

6. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3333`

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/brevly` |
| `PORT` | Server port | `3333` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `your-account-id` |
| `CLOUDFLARE_ACCESS_KEY_ID` | R2 access key | `your-access-key` |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | R2 secret key | `your-secret-key` |
| `CLOUDFLARE_BUCKET` | R2 bucket name | `your-bucket` |
| `CLOUDFLARE_PUBLIC_URL` | Public URL for shortened links | `https://short.ly` |

## 🗄️ Database Schema

The application uses a single `links` table with the following structure:

```sql
CREATE TABLE "links" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(10) NOT NULL UNIQUE,
  "original_url" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "access_count" integer DEFAULT 0 NOT NULL
);
```

## 🐳 Docker Deployment

### Development with Docker Compose
```bash
docker-compose up -d
```

### Production Build
```bash
# Build the image
docker build -t url-shortener .

# Run the container
docker run -p 3333:3333 --env-file .env url-shortener
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate database migration files |
| `npm run db:migrate` | Apply database migrations |

## 🏗️ Project Structure

```
src/
├── db/
│   ├── index.ts          # Database connection setup
│   └── schema.ts         # Drizzle schema definitions
├── http/
│   └── routes.ts         # API route handlers
├── lib/
│   └── r2.ts            # Cloudflare R2 client setup
├── env.ts               # Environment validation
└── server.ts            # Fastify server setup
```

## 🔗 Key Features Explained

### URL Shortening Algorithm
- Uses [`nanoid`](https://github.com/ai/nanoid) for generating unique 6-character codes
- Supports custom codes with uniqueness validation
- Handles collision detection and error handling

### Analytics & Tracking
- Automatic access counting on each redirect
- Database-level increment operations for accuracy
- Timestamped creation tracking

### CSV Export
- Generates comprehensive CSV reports
- Uploads to Cloudflare R2 for reliable access
- Includes all link metadata and statistics

### Performance Optimizations
- Efficient pagination with `LIMIT` and `OFFSET`
- Database indexing on frequently queried fields
- Structured logging for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

Built with ❤️ for the RocketSeat POS program