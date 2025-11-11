export interface Drink {
  id: number;
  name: string;
  price: number;
  howManySold: number;
}

export interface gachaList {
  version: number;
  drinks: Drink[];
  startDate: Date;
  endDate: Date;
  cost: number;
}

export interface Post {
  id: string;
  nickname: string;
  postedAt: Date;
  drink1_id: number;
  drink2_id: number;
  pictureUrl: string;
  profits: number;
}

export interface User {
  sumProfit: number;
  totalGachaCount: number;
  totalDrinkCount: number;
  myPostsId: string[];
}

export interface AggregateData {
  totalProfit: number;
  totalGachaCount: number;
  totalDrinkCount: number;
}