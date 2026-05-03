export type Rating = 'bad' | 'good' | 'great';

export interface App {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  screenshot_url: string | null;
  rating: Rating | null;
  tags: string[];
  created_at: string;
}
