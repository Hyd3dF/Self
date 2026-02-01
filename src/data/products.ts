export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    rating: number;
}

export const PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Classic Leather Watch',
        price: 199.99,
        description: 'A timeless classic leather watch with a minimalist design.',
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80',
        rating: 4.5,
    },
    {
        id: '2',
        name: 'Premium Wireless Headphones',
        price: 299.99,
        description: 'Noise cancelling headphones with superior sound quality.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80',
        rating: 4.8,
    },
    {
        id: '3',
        name: 'Minimalist Sneaker',
        price: 129.50,
        description: 'Comfortable everyday sneakers.',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80',
        rating: 4.2,
    },
    {
        id: '4',
        name: 'Smart Home Speaker',
        price: 89.99,
        description: 'Control your home with your voice.',
        image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80',
        rating: 4.6,
    },
    {
        id: '5',
        name: 'Designer Sunglasses',
        price: 159.00,
        description: 'Protect your eyes in style.',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80',
        rating: 4.7,
    },
];
