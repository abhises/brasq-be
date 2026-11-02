-- New post types: product comparisons (2–4 products) and informational explainers.
-- IF NOT EXISTS keeps this safe on databases where 'comparison' was added by hand during development.
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'comparison';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'informational';
