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
