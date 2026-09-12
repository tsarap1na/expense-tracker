export interface Category {
    id: number;
    name: string;
    color: string;
}

export interface Tag {
    id: number;
    name: string;
}

export interface Transaction {
    id: number;
    amount: number;
    type: 'expense' | 'income';
    description: string;
    date: string;
    categoryId: number;
    category: Category;
    tags: Tag[];
}

export interface Budget {
    id: number;
    categoryId: number;
    month: string;
    limitAmount: number;
    category: Category;
}

export interface Recurring {
    id: number;
    categoryId: number;
    amount: number;
    type: 'expense' | 'income';
    description: string;
    frequency: 'day' | 'week' | 'month';
    nextRunAt: string;
    isActive: boolean;
    category: Category;
}