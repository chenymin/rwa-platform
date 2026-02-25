'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  tx_hash: string;
  block_number: number;
  block_hash: string;
  block_timestamp: string;
  gas_used: number | null;
  gas_price: string | null;
  event_type: 'mint' | 'transfer' | 'approval';
  from_address: string;
  to_address: string;
  token_amount: string | null;
  usdt_amount: string | null;
  contract_address: string;
  user_privy_id: string | null;
  created_at: string;
  // 格式化字段
  token_amount_formatted: string | null;
  usdt_amount_formatted: string | null;
  description: string;
}

export interface TransactionFilters {
  type?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 获取用户交易列表
 */
export function useTransactions(
  filters: TransactionFilters = {},
  page: number = 1,
  limit: number = 20
) {
  const fetchTransactions = async (): Promise<TransactionsResponse> => {
    // 获取 session
    const sessionStr = localStorage.getItem('supabase_session');
    if (!sessionStr) {
      throw new Error('未登录');
    }

    // 构建查询参数
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    if (filters.type && filters.type.length > 0) {
      params.set('type', filters.type.join(','));
    }
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }
    if (filters.minAmount) {
      params.set('minAmount', filters.minAmount);
    }
    if (filters.maxAmount) {
      params.set('maxAmount', filters.maxAmount);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }

    const response = await fetch(`/api/transactions?${params.toString()}`, {
      headers: {
        'x-supabase-session': sessionStr,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取交易列表失败');
    }

    return response.json();
  };

  return useQuery({
    queryKey: ['transactions', filters, page, limit],
    queryFn: fetchTransactions,
    staleTime: 30 * 1000, // 30 秒
  });
}

/**
 * 获取交易详情
 */
export function useTransactionDetail(hash: string | null) {
  const fetchDetail = async () => {
    if (!hash) return null;

    const sessionStr = localStorage.getItem('supabase_session');
    if (!sessionStr) {
      throw new Error('未登录');
    }

    const response = await fetch(`/api/transactions/${hash}`, {
      headers: {
        'x-supabase-session': sessionStr,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取交易详情失败');
    }

    const data = await response.json();
    return data.data;
  };

  return useQuery({
    queryKey: ['transaction', hash],
    queryFn: fetchDetail,
    enabled: !!hash,
  });
}

/**
 * 交易筛选状态管理
 */
export function useTransactionFilters() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [page, setPage] = useState(1);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // 重置页码
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  return {
    filters,
    page,
    updateFilters,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
}
