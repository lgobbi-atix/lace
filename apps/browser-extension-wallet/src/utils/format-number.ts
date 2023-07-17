/* eslint-disable no-magic-numbers */
import { DEFAULT_DECIMALS } from '@lace/common';
import BigNumber from 'bignumber.js';
import { getNumberUnit, UnitThreshold } from './get-number-unit';

type GetCaretPositionForFormattedCurrencyProps = {
  // current partially formatted value
  currentDisplayValue: string;
  // cursor position for current partially formatted value
  currentCursorPosition: number;
  // new formatted value
  displayValue: string;
};

/**
 * Shortens a number to a desired length
 * @param str The string representation of the number
 * @param length The new desired length
 * @returns The shortened number as a string
 */
export const shortenNumber = (str: string, length: number): string =>
  length > 0 && str?.length > length ? `${str.slice(0, length)}` : str;

/**
 * Checks if a given string is a valid numeric value.
 *
 * @param str The string to be checked.
 * @returns `true` if the string is a valid numeric value, `false` otherwise.
 */
export const isNumeric = (str: string): boolean => !new BigNumber(str).isNaN();

/**
 * Formats a numeric string value with the specified decimal places.
 *
 * @param value The numeric string value to be formatted.
 * @param decimalPlaces The number of decimal places.
 * @returns The formatted number string.
 */
export const formatLocaleNumber = (value: string, decimalPlaces: number = DEFAULT_DECIMALS): string =>
  new BigNumber(value).toFormat(decimalPlaces, BigNumber.ROUND_DOWN, {
    groupSize: 3,
    // TODO: get from locale [LW-6089]
    groupSeparator: ',',
    decimalSeparator: '.'
  });

// WIP: refactor MISSING - tests MISSING
/**
 * Formats a numeric string with optional decimal places.
 *
 * @param value The number string to be formatted.
 * @param maxDecimals The maximum number of decimal places to include. Default is 0.
 * @returns The formatted number string.
 */
export const getInlineCurrencyFormat = (value: string, maxDecimals = 0): string => {
  if (!value) return '0';
  // Remove any character that is not a dot or a number
  const parsedStringValue = value.replace(/[^\d.]/g, '');

  // If the value has not decimal part then format to locale string with grouping
  if (!parsedStringValue.includes('.')) {
    return BigInt(parsedStringValue).toLocaleString('fullwide', { useGrouping: true });
  }

  // Split the integer and the decimal parts
  const numParts = parsedStringValue.split('.');
  // Format the integer part to locale string with grouping
  const integerPart = BigInt(numParts[0]).toLocaleString('fullwide', {
    useGrouping: true
  });

  // If there is more than one dot, remove all but the first one.
  // Otherwise, shorten the decimals to the maxDecimals parameter
  //   For example:
  //     123.456.78.9 -> 123.456789 (regardless of maxDecimals)
  //     123.456 -> 123.4 (with maxDecimals = 1)
  const decimalPart = numParts.length > 2 ? numParts.slice(1).join('') : shortenNumber(numParts[1], maxDecimals);
  return maxDecimals > 0 ? `${integerPart}.${decimalPart}` : integerPart;
};

// WIP: refactor MISSING - tests MISSING
/**
 * Checks if the user tries to remove a comma from the previous value and also removes the character before it.
 *
 * Otherwise, returns the new value as it is
 */
export const getChangedValue = ({
  currentCursorPosition,
  currentDisplayValue: newValue,
  displayValue: previousValue
}: GetCaretPositionForFormattedCurrencyProps): {
  currentDisplayValue: string;
  value: string;
  currentCursorPosition: number;
} => {
  // Finds first different character between old and new value
  const lastChangedIndex = [...previousValue].findIndex((el, index) => el !== [...newValue][index]);

  // Check if the change is a deletion of a ','
  if (previousValue[lastChangedIndex] === ',' && previousValue.length - newValue.length === 1) {
    // If a comma was deleted in the new value then also delete the character before the comma
    const newDisplayValue = `${newValue.slice(0, lastChangedIndex - 1)}${newValue.slice(
      lastChangedIndex,
      newValue.length
    )}`;

    return {
      currentDisplayValue: newDisplayValue, // new value without the deleted comma and the character before it, still has all other commas
      value: newDisplayValue.split(',').join(''), // new value without any comma
      currentCursorPosition: currentCursorPosition - 1 // reposition the cursor to where the deleted character was
    };
  }

  // If the change was not the deletion of a comma then return the new value as it is
  return { currentDisplayValue: newValue, value: newValue.split(',').join(''), currentCursorPosition };
};

// WIP: refactor MISSING - tests MISSING
/**
 * Calculates the proper cursor position for formatted numbers with group separators and decimals
 */
export const getCaretPositionForFormattedCurrency = ({
  currentDisplayValue: displayValueWithCommas,
  displayValue: valueWithoutCommas,
  currentCursorPosition
}: GetCaretPositionForFormattedCurrencyProps): number => {
  const reversedValue = [...displayValueWithCommas].reverse();
  // Index of "." char in case of decimal value
  const decimalIndex = reversedValue.indexOf('.');
  // Index of the last "changed" character, determined by the current cursor position
  const lastChangedCharIndex = displayValueWithCommas.length - currentCursorPosition;

  // Check that there is no decimal part or that the last changed character is before the decimal part
  if (decimalIndex === -1 || lastChangedCharIndex > decimalIndex) {
    // Array of characters in the integer part until the last changed char index
    // eg: with displayValueWithCommas = 12,345.67 and currentCursorPosition = 1 (index of '2' in displayValueWithCommas)
    //          reversedValue = [ '7', '6', '.', '5', '4', '3', ',', '2', '1' ]
    //          lastChangedCharIndex = 8 (index of '2'  in reversedValue + 1)
    //          decimalIndex = 2 (index of  '.' in reversedValue)
    //          Sliced reversed from 2 to 8 = ['.', '5', '4', '3', ',', '2']
    const reversedIntegerPartTillLastChangedCharArray = reversedValue.slice(
      Math.max(decimalIndex, 0),
      lastChangedCharIndex
    );
    // Remove commas and join the sliced reversedValue to get the integer part of the number starting from the last changed character
    // eg: from ['.', '5', '4', '3', ',', '2'] to '.5432'
    const reversedIntegerPartTillLastChangedCharWithoutCommas = reversedIntegerPartTillLastChangedCharArray
      .join('')
      .split(',')
      .join('');

    // Get the number of commas in the reversedIntegerPartTillLastChangedCharArray slice
    // by calculating the length difference between the sliced reversed value and the joined version without commas
    const numberOfCommasInPartiallyFormattedValue =
      reversedIntegerPartTillLastChangedCharArray.length - reversedIntegerPartTillLastChangedCharWithoutCommas.length;

    // Put comma every 3 characters (getInlineCurrencyFormat)
    const groups = 3;
    // Number of possible ',' that could be placed by getInlineCurrencyFormat
    // eg: for 12345 -> 12,345 it would be 1 comma char
    const numberOfCommas = Math.max(
      Math.floor((reversedIntegerPartTillLastChangedCharWithoutCommas.length - 1) / groups),
      0
    );

    // Get proper cursor position (not for the reversed value)
    return (
      valueWithoutCommas.length - (lastChangedCharIndex - numberOfCommasInPartiallyFormattedValue + numberOfCommas)
    );
  }

  return currentCursorPosition;
};

/**
 * Formats a numeric string to have a maximum of two decimal places and returns its corresponding unit.
 *
 * @param number The number string to be formatted and to get its unit
 * @returns An object with the formatted number and its corresponding unit
 */
export const formatNumber = (number: string): { number: string; unit?: string } => {
  const bigNumber = new BigNumber(number);
  if (bigNumber.isNaN()) return { number };

  const { unit, unitThreshold } = getNumberUnit(bigNumber);
  const threshold = unitThreshold === UnitThreshold.ZERO ? 1 : unitThreshold;
  return { number: bigNumber.div(threshold).decimalPlaces(2).toString(), unit };
};

/**
 * Returns a formatted string of a number value with the desired decimal places (2 by default) and its corresponding unit.
 * If the value has more decimals places than the desired amount, it will be truncated.
 *
 * @param value The value to be formatted
 * @param decimals The desired decimal places (default = 2)
 * @returns The formatted value with the desired decimals and the unit as a string
 */
export const compactNumber = (value: number | string, decimals = DEFAULT_DECIMALS): string => {
  const bigNumberValue = value ? new BigNumber(value) : new BigNumber(0);

  if (bigNumberValue.isNaN()) return formatLocaleNumber('0', decimals);
  const { unit, unitThreshold } = getNumberUnit(bigNumberValue);
  if (unitThreshold < UnitThreshold.MILLION) return formatLocaleNumber(bigNumberValue.toString(), decimals);

  const valueToFormat = bigNumberValue.dividedBy(unitThreshold);
  return `${formatLocaleNumber(valueToFormat.toString(), decimals)}${unit}`;
};
