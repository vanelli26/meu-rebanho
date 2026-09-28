import { mesclarClasses } from '@/components/ui/Texto';

describe('mesclarClasses', () => {
  const variante = 'font-semi text-[18px] leading-[24px]';

  it('mantém a variante quando não há sobrescrita', () => {
    expect(mesclarClasses(variante, 'mt-2')).toBe('font-semi text-[18px] leading-[24px] mt-2');
  });

  it('troca tamanho e fonte passados no className', () => {
    expect(mesclarClasses(variante, 'text-[16px] font-negrito')).toBe(
      'leading-[24px] text-[16px] font-negrito',
    );
  });

  it('troca entrelinha e espaçamento', () => {
    expect(
      mesclarClasses(
        'font-extra text-[32px] leading-[38px] tracking-tight',
        'leading-[46px] tracking-widest',
      ),
    ).toBe('font-extra text-[32px] leading-[46px] tracking-widest');
  });
});
