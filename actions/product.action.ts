'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface CreateProductInput {
  name: string;
  category: 'wall' | 'floor' | 'ceiling' | 'window' | 'furniture';
  styleTag: string;
  textureUrl: string;
  price: number;
  unitType?: string;
}

// 1. CREATE: Naya product add karna
export async function createProduct(data: CreateProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        styleTag: data.styleTag.toLowerCase(),
        textureUrl: data.textureUrl,
        price: data.price,
        unitType: data.unitType || 'sqm',
      },
    });

    revalidatePath('/products');
    return { success: true, data: product };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

// 2. READ: Saare products ki list ya specific product fetch karna
export async function getVendorProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'Failed to fetch products' };
  }
}

// 3. UPDATE: Product ki details (price, name, style) update karna
export async function updateProduct(id: string, data: Partial<CreateProductInput>) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.styleTag && { styleTag: data.styleTag.toLowerCase() }),
        ...(data.textureUrl && { textureUrl: data.textureUrl }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.unitType && { unitType: data.unitType }),
      },
    });

    revalidatePath('/products');
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

// 4. DELETE: Product ko catalog se remove karna
export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/products');
    return { success: true, message: 'Product deleted successfully' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function getMatchingProducts(category: string, styleTag?: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: category,
        ...(styleTag && { styleTag: styleTag.toLowerCase() }),
      },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching matching products:', error);
    return { success: false, error: 'Failed to fetch products' };
  }
}