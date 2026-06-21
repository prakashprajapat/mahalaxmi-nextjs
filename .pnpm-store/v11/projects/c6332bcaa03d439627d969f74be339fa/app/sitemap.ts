import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://mahalaxmifashionhub.com', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/products', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/saree', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/women', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/men', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/nighty', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/petticoat', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/best-sellers', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/about-us', lastModified: new Date() },
    { url: 'https://mahalaxmifashionhub.com/contact', lastModified: new Date() },
  ]
}
