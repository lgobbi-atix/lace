/* eslint-disable no-magic-numbers */
import '@testing-library/jest-dom';
import * as formatNumber from '../format-number';

describe('format-number utils', () => {
  describe('shortenNumber', () => {
    test('shortens a number string to the new desired length', () => {
      expect(formatNumber.shortenNumber('1234', 2)).toEqual('12');
    });

    test('returns the same string if the new length is equal or greater than the string length', () => {
      expect(formatNumber.shortenNumber('1234', 4)).toEqual('1234');
      expect(formatNumber.shortenNumber('123', 4)).toEqual('123');
    });

    test('ignores negative values or zero as the new length', () => {
      expect(formatNumber.shortenNumber('12345', -2)).toEqual('12345');
      expect(formatNumber.shortenNumber('12345', 0)).toEqual('12345');
    });
  });

  describe('isNumeric', () => {
    test('returns false if the string is not a valid number', () => {
      expect(formatNumber.isNumeric('asd')).toEqual(false);
      expect(formatNumber.isNumeric('')).toEqual(false);
      expect(formatNumber.isNumeric('11a')).toEqual(false);
      expect(formatNumber.isNumeric('111.123t')).toEqual(false);
      expect(formatNumber.isNumeric('111.123.123')).toEqual(false);
      expect(formatNumber.isNumeric('200,000')).toEqual(false);
    });
    test('returns true if the string is a valid number', () => {
      expect(formatNumber.isNumeric('200')).toEqual(true);
      expect(formatNumber.isNumeric('-200')).toEqual(true);
      expect(formatNumber.isNumeric('111.123')).toEqual(true);
      expect(formatNumber.isNumeric('5e6')).toEqual(true); // 5_000_000
    });
  });

  describe('formatLocaleNumber', () => {
    test('uses "." to separate decimals and "," to separate groups of 3 digits', () => {
      expect(formatNumber.formatLocaleNumber('1000000.55', 2)).toEqual('1,000,000.55');
    });
    describe('formats the number with the desired amount of decimals', () => {
      test('rounds number to 0 if the original value has more decimals than desired', () => {
        expect(formatNumber.formatLocaleNumber('999.99', 1)).toEqual('999.9'); // does not round up
        expect(formatNumber.formatLocaleNumber('999.44', 1)).toEqual('999.4');
      });
      test('fills with zeroes if the amount of desired decimals is greater than in the original value', () => {
        expect(formatNumber.formatLocaleNumber('999.999', 4)).toEqual('999.9990');
        expect(formatNumber.formatLocaleNumber('999', 4)).toEqual('999.0000'); // no decimals in original
      });
      test('defaults to 2 decimals if no amount for decimal places was provided', () => {
        expect(formatNumber.formatLocaleNumber('100')).toEqual('100.00');
      });
      test('no decimal part if 0 is the desired amount', () => {
        expect(formatNumber.formatLocaleNumber('500.999', 0)).toEqual('500');
      });
      test('works with negative values', () => {
        expect(formatNumber.formatLocaleNumber('-999.999')).toEqual('-999.99');
        expect(formatNumber.formatLocaleNumber('-100.12')).toEqual('-100.12');
        expect(formatNumber.formatLocaleNumber('-100')).toEqual('-100.00');
      });
    });
  });

  describe('formatNumber', () => {
    test('formats a number rounding up to 2 decimal places according to its unit', () => {
      expect(formatNumber.formatNumber('10234')).toEqual({ number: '10.23', unit: 'K' });
      expect(formatNumber.formatNumber('10235')).toEqual({ number: '10.24', unit: 'K' });
      expect(formatNumber.formatNumber('10235000')).toEqual({ number: '10.24', unit: 'M' });
      expect(formatNumber.formatNumber('10235000000')).toEqual({ number: '10.24', unit: 'B' });
      expect(formatNumber.formatNumber('10235000000000')).toEqual({ number: '10.24', unit: 'T' });
      expect(formatNumber.formatNumber('10235000000000000')).toEqual({ number: '10.24', unit: 'Q' });
    });

    test(
      'formats a number rounding up to 2 decimal places and returns an empty string as the unit ' +
        'when the number is less than 1000',
      () => {
        expect(formatNumber.formatNumber('999')).toEqual({ number: '999', unit: '' });
        expect(formatNumber.formatNumber('999.99')).toEqual({ number: '999.99', unit: '' });
        expect(formatNumber.formatNumber('999.991')).toEqual({ number: '999.99', unit: '' });
        expect(formatNumber.formatNumber('999.999')).toEqual({ number: '1000', unit: '' });
      }
    );

    test('returns the same value and no unit in case of a NaN value', () => {
      expect(formatNumber.formatNumber('asd')).toEqual({ number: 'asd' });
    });

    test('formats negatives and decimal values', () => {
      expect(formatNumber.formatNumber('-912180')).toEqual({ number: '-912.18', unit: 'K' });
      expect(formatNumber.formatNumber('123452.2222')).toEqual({ number: '123.45', unit: 'K' });
      expect(formatNumber.formatNumber('123455.5555')).toEqual({ number: '123.46', unit: 'K' });
    });

    test('removes any leading or trailing zeroes while formatting', () => {
      expect(formatNumber.formatNumber('0000010234')).toEqual({ number: '10.23', unit: 'K' });
      expect(formatNumber.formatNumber('1000.00000')).toEqual({ number: '1', unit: 'K' });
    });
  });

  describe('compactNumber', () => {
    test('completes the decimal part with the correct amount of zeroes', () => {
      expect(formatNumber.compactNumber('10')).toEqual('10.00');
      expect(formatNumber.compactNumber('10', 3)).toEqual('10.000');
      expect(formatNumber.compactNumber('0.23', 4)).toEqual('0.2300');
    });

    test('truncates decimals to the desired amount', async () => {
      expect(formatNumber.compactNumber('100.123')).toEqual('100.12'); // 2 by default
      expect(formatNumber.compactNumber('100.999')).toEqual('100.99');
      expect(formatNumber.compactNumber('0.5009', 3)).toEqual('0.500');
      expect(formatNumber.compactNumber('100.999', 0)).toEqual('100');
    });

    test('returns zero when the given value is not defined, an empty string or NaN', () => {
      expect(formatNumber.compactNumber('')).toEqual('0.00');
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(formatNumber.compactNumber(undefined)).toEqual('0.00');
      expect(formatNumber.compactNumber('asd')).toEqual('0.00');
    });

    test('returns the compacted number with the corresponding decimals and unit when greater than one million', () => {
      expect(formatNumber.compactNumber('1000000')).toEqual('1.00M');
      expect(formatNumber.compactNumber('1000000000')).toEqual('1.00B');
      expect(formatNumber.compactNumber('1000000000000')).toEqual('1.00T');
      expect(formatNumber.compactNumber('1000000000000000')).toEqual('1.00Q');
    });

    test('separates thousands with commas', () => {
      expect(formatNumber.compactNumber('1000')).toEqual('1,000.00');
      expect(formatNumber.compactNumber('10000')).toEqual('10,000.00');
      expect(formatNumber.compactNumber('100000')).toEqual('100,000.00');
    });

    test('does not compact the number when it is less than one million', () => {
      expect(formatNumber.compactNumber('100')).toEqual('100.00');
      expect(formatNumber.compactNumber('1000')).toEqual('1,000.00');
      expect(formatNumber.compactNumber('999999')).toEqual('999,999.00');
    });
    test('should compact the number to quadrillion when its order of magnitude is 18 or higher', () => {
      expect(formatNumber.compactNumber(1e18)).toEqual('1,000.00Q');
      expect(formatNumber.compactNumber(1e21)).toEqual('1,000,000.00Q');
      expect(formatNumber.compactNumber(1e24)).toEqual('1,000,000,000.00Q');
    });

    test('does not lose any significant digits for big numbers', () => {
      // Higher than the max Number for JS
      const bigNumber = '123456789012345678901234567890123456789';
      expect(formatNumber.compactNumber(bigNumber)).toEqual('123,456,789,012,345,678,901,234.56Q');
      // Number() loses significant digits after the 18th one
      expect(formatNumber.compactNumber(Number(bigNumber))).toEqual('123,456,789,012,345,680,000,000.00Q');
    });
  });
});

describe('Testing getInlineCurrencyFormat', () => {
  test('getInlineCurrencyFormat', () => {
    expect(formatNumber.getInlineCurrencyFormat('')).toEqual('0');
    expect(formatNumber.getInlineCurrencyFormat('123a')).toEqual(
      BigInt('123').toLocaleString('fullwide', { useGrouping: true })
    );

    const shortenNumberSpy = jest.spyOn(formatNumber, 'shortenNumber');

    expect(formatNumber.getInlineCurrencyFormat('123a.123', 1)).toEqual(
      `${BigInt('123').toLocaleString('fullwide', {
        useGrouping: true
      })}.1`
    );
    expect(shortenNumberSpy).toBeCalledTimes(1);
    expect(shortenNumberSpy).toBeCalledWith('123', 1);
    shortenNumberSpy.mockClear();

    expect(formatNumber.getInlineCurrencyFormat('123a.123.123', 1)).toEqual(
      `${BigInt('123').toLocaleString('fullwide', {
        useGrouping: true
      })}.${'123123'}`
    );
    shortenNumberSpy.mockClear();

    expect(formatNumber.getInlineCurrencyFormat('123a.123.123')).toEqual(
      BigInt('123').toLocaleString('fullwide', {
        useGrouping: true
      })
    );
  });
});

describe('Testing getChangedValue', () => {
  test('should remove prev number if current removed value is comma', () => {
    expect(
      formatNumber.getChangedValue({
        currentCursorPosition: 3,
        currentDisplayValue: '123456,789',
        displayValue: '123,456,789'
      })
    ).toEqual({
      currentDisplayValue: '12456,789',
      value: '12456789',
      currentCursorPosition: 2
    });
  });
  test('should return changed calue otherwise', () => {
    expect(
      formatNumber.getChangedValue({
        currentCursorPosition: 3,
        currentDisplayValue: '12456,789',
        displayValue: '123,456,789'
      })
    ).toEqual({
      currentDisplayValue: '12456,789',
      value: '12456789',
      currentCursorPosition: 3
    });

    expect(
      formatNumber.getChangedValue({
        currentCursorPosition: 3,
        currentDisplayValue: '12356,789',
        displayValue: '123,456,789'
      })
    ).toEqual({
      currentDisplayValue: '12356,789',
      value: '12356789',
      currentCursorPosition: 3
    });
  });
});

describe('Testing getCaretPositionForFormattedCurrency', () => {
  test('should return current cursor position in case of integer value', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '12,456,789',
        displayValue: '124,567,89',
        currentCursorPosition: 4
      })
    ).toEqual(4);
  });
  test('should return same cursor position in case of integer value', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '1234',
        displayValue: '1,234',
        currentCursorPosition: 1
      })
    ).toEqual(2);
  });
  test('should return current cursor position in case of float value with last changed deciaml part ', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '123,456,789.12456',
        displayValue: '123,456,789.12456',
        currentCursorPosition: 14
      })
    ).toEqual(14);
  });
  test('should return current cursor position in case of float value with last changed whole part ', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '12,456,789.12456',
        displayValue: '124,567,89.12456',
        currentCursorPosition: 4
      })
    ).toEqual(4);
  });
  test('should return proper cursor position in case of integer value', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '12,4',
        displayValue: '124',
        currentCursorPosition: 4
      })
    ).toEqual(3);
  });
  test('should return proper cursor position in case of integer value', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '1234',
        displayValue: '123,4',
        currentCursorPosition: 4
      })
    ).toEqual(5);
  });
  test('should return proper cursor position in case of decimal value', () => {
    expect(
      formatNumber.getCaretPositionForFormattedCurrency({
        currentDisplayValue: '1234.567',
        displayValue: '123,4.567',
        currentCursorPosition: 4
      })
    ).toEqual(5);
  });
});
