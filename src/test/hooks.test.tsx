import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSwapForm, useClipboard, useMediaQuery } from '@/hooks';

describe('useSwapForm', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSwapForm());

    expect(result.current.inputAsset).toBeNull();
    expect(result.current.outputAsset).toBeNull();
    expect(result.current.inputAmount).toBe('');
    expect(result.current.errors).toEqual({});
  });

  it('validates wallet not connected', async () => {
    const { result } = renderHook(() => useSwapForm());

    act(() => {
      result.current.setInputAsset({
        code: 'XLM',
        issuer: '',
        type: 'native',
      });
      result.current.setOutputAsset({
        code: 'USDC',
        issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        type: 'credit_alphanum4',
      });
      result.current.setInputAmount('10');
    });

    let isValid = false;
    await act(async () => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    await waitFor(() => {
      expect(result.current.errors.wallet).toBeDefined();
    });
  });

  it('validates same asset swap', async () => {
    const { result } = renderHook(() => useSwapForm());

    act(() => {
      result.current.setInputAsset({
        code: 'XLM',
        issuer: '',
        type: 'native',
      });
      result.current.setOutputAsset({
        code: 'XLM',
        issuer: '',
        type: 'native',
      });
      result.current.setInputAmount('10');
    });

    let isValid = false;
    await act(async () => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    await waitFor(() => {
      expect(result.current.errors.outputAsset).toBeDefined();
    });
  });

  it('swaps assets correctly', () => {
    const { result } = renderHook(() => useSwapForm());

    act(() => {
      result.current.setInputAsset({
        code: 'XLM',
        issuer: '',
        type: 'native',
      });
      result.current.setOutputAsset({
        code: 'USDC',
        issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        type: 'credit_alphanum4',
      });
    });

    act(() => {
      result.current.swapAssets();
    });

    expect(result.current.inputAsset?.code).toBe('USDC');
    expect(result.current.outputAsset?.code).toBe('XLM');
  });

  it('validates empty input amount', async () => {
    const { result } = renderHook(() => useSwapForm());

    act(() => {
      result.current.setInputAsset({
        code: 'XLM',
        issuer: '',
        type: 'native',
      });
      result.current.setOutputAsset({
        code: 'USDC',
        issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        type: 'credit_alphanum4',
      });
    });

    let isValid = false;
    await act(async () => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    await waitFor(() => {
      expect(result.current.errors.inputAmount).toBeDefined();
    });
  });
});

describe('useClipboard', () => {
  it('sets copied state to true after copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test-address');
    });

    expect(result.current.copied).toBe(true);
  });

  it('handles clipboard failure gracefully', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      writable: true,
    });

    const { result } = renderHook(() => useClipboard());

    const success = await act(async () => {
      return await result.current.copy('test');
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
  });
});

describe('useMediaQuery', () => {
  it('returns false for desktop view', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true for mobile view', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });
});
