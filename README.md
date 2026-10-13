# Floors & Walls: Interactive Space Designer (demo MVP)

Next.js 14 + TypeScript + Tailwind. No backend; all data is placeholder.

    npm install
    npm run dev        # http://localhost:3000

## Where to change things
- `data/products.ts`: products and prices (replace with the client's catalogue)
- `data/themes.ts`: ready-made rooms
- `lib/config.ts`: currency, room area, fitting rates, WhatsApp number
- `components/RoomPreview.tsx`: the SVG room

## Notes
- WhatsApp opens a pre-filled chat; the PDF is attached by the customer (a website cannot attach files).
- Not in this demo: admin panel, database, lookbook hotspots, real photos/3D, FAQ and reviews.
