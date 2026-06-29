import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  type Purchase,
  type PurchaseError,
  type ProductAndroid,
} from 'react-native-iap';
import { supabase } from './supabase';
import { useProStore } from '@/store/proStore';

export const PRO_PRODUCT_ID = 'brecise_pro_lifetime';

// ── Init koneksi ke store ─────────────────────────────────────────────────────
export async function initIAP(): Promise<boolean> {
  try {
    await initConnection();
    return true;
  } catch (err) {
    console.warn('IAP initConnection failed:', err);
    return false;
  }
}

export async function closeIAP() {
  try {
    await endConnection();
  } catch (_) {}
}

// ── Ambil info produk dari Play Store ────────────────────────────────────────
export async function getProProduct(): Promise<ProductAndroid | null> {
  try {
    const products = await fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' });
    return (products?.[0] as ProductAndroid) ?? null;
  } catch (err) {
    console.warn('fetchProducts failed:', err);
    return null;
  }
}

// ── Proses pembelian ──────────────────────────────────────────────────────────
export async function purchasePro(): Promise<{ success: boolean; error?: string }> {
  try {
    await requestPurchase({
      request: {
        google: { skus: [PRO_PRODUCT_ID] },
      },
      type: 'in-app',
    });
    // Result datang via purchaseUpdatedListener, bukan return value
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'E_USER_CANCELLED') {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: err?.message ?? 'Terjadi kesalahan' };
  }
}

// ── Simpan status Pro ke Supabase ─────────────────────────────────────────────
export async function saveProToSupabase(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id);

    if (error) throw error;
    useProStore.getState().setIsPro(true);
    return true;
  } catch (err) {
    console.warn('saveProToSupabase failed:', err);
    return false;
  }
}

// ── Cek status Pro dari Supabase (dipanggil saat app launch) ──────────────────
export async function checkProStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    const isPro = data?.is_premium ?? false;
    useProStore.getState().setIsPro(isPro);
    return isPro;
  } catch (err) {
    console.warn('checkProStatus failed:', err);
    return false;
  }
}

// ── Restore purchases (untuk user reinstall app) ──────────────────────────────
export async function restorePurchases(): Promise<{ success: boolean; restored: boolean }> {
  try {
    const purchases = await getAvailablePurchases();
    const hasPro = purchases.some((p) => p.productId === PRO_PRODUCT_ID);
    if (hasPro) {
      await saveProToSupabase();
      return { success: true, restored: true };
    }
    return { success: true, restored: false };
  } catch (err) {
    console.warn('restorePurchases failed:', err);
    return { success: false, restored: false };
  }
}

// ── Purchase listener (pasang di root app) ────────────────────────────────────
export function setupPurchaseListeners() {
  const updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
    if (purchase.productId === PRO_PRODUCT_ID) {
      await finishTransaction({ purchase, isConsumable: false });
      await saveProToSupabase();
    }
  });

  const errorSub = purchaseErrorListener((error: PurchaseError) => {
    console.warn('purchaseError:', error);
  });

  return () => {
    updateSub.remove();
    errorSub.remove();
  };
}