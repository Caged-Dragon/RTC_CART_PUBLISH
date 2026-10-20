import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Product } from '../data/products';
import { getExactProductImage, getFallbackProductImage } from '../utils/productImages';

type ProductImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onError'> & {
  product: Product;
  alt?: string;
};

/** Displays the live product image first, then a bundled fallback if the URL is unavailable. */
export const ProductImage: React.FC<ProductImageProps> = ({ product, alt = product.name, ...imgProps }) => {
  const primarySource = getExactProductImage(product);
  const fallbackSource = getFallbackProductImage(product);
  const [source, setSource] = useState(primarySource);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(primarySource);
    setFailed(false);
  }, [primarySource]);

  const handleError = () => {
    if (fallbackSource && source !== fallbackSource) setSource(fallbackSource);
    else setFailed(true);
  };

  if (failed || !source) {
    return (
      <span className={`rt-product-image-fallback ${imgProps.className || ''}`} role="img" aria-label={alt}>
        <Sparkles aria-hidden="true" />
      </span>
    );
  }

  return <img {...imgProps} src={source} alt={alt} onError={handleError} />;
};
