import { z } from 'zod';

/** Every post type, in the order the admin shows them. Keep in sync with `enum PostType` in prisma/schema.prisma. */
export const POST_TYPES = ['guide', 'review', 'comparison', 'informational', 'page'] as const;
export const postType = z.enum(POST_TYPES);

/** Types that are articles (shown on author pages, search and category pages), as opposed to static pages. */
export const ARTICLE_TYPES = ['guide', 'review', 'comparison', 'informational'] as const;
