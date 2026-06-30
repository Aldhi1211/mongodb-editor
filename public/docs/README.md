# Gambar dokumentasi (MontraDocs)

Taruh file gambar untuk in-app docs di folder ini. Referensikan dari komponen docs
dengan path absolut dari `public/`, mis:

```tsx
<DocImage src="/docs/restart-jar-1.png" alt="Langkah restart jar" caption="Keterangan gambar" />
```

- File di `public/docs/restart-jar-1.png` → diakses sebagai `/docs/restart-jar-1.png`.
- Format yang didukung: PNG, JPG, GIF, SVG, WEBP.
- `DocImage` otomatis memberi border, caption, dan klik-untuk-zoom (lightbox).
