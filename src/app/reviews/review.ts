// Mirrors the REVIEWS table: one review per order (order_id is unique).
// reviewStatus records whether the order has been reviewed; once it is 'reviewed' the order cannot be reviewed again.
// buyerName stands in for buyer_id until the app has sessions.
export type ReviewStatus = 'not_reviewed' | 'reviewed';

export interface Review {
  reviewId: number;
  orderId: number;
  buyerName: string;
  reviewStatus: ReviewStatus;
  comment: string;
}

export function isReviewed(review: Review | null | undefined): boolean {
  return review?.reviewStatus === 'reviewed';
}
