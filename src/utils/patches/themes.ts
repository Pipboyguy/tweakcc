// Please see the note about writing patches in ./index.js.

import { Theme } from '../types.js';
import { LocationResult, showDiff } from './index.js';

function getThemesLocation(oldFile: string): {
  switchStatement: LocationResult;
  objArr: LocationResult | null;
  obj: LocationResult | null;
} | null {
  // Look for case statement pattern in LEA function: case"light":return{...}
  const switchPattern =
    /case"light":return\{[^}]+\};/s;
  const switchMatch = oldFile.match(switchPattern);

  if (!switchMatch || switchMatch.index == undefined) {
    console.error('patch: themes: failed to find switchMatch');
    return null;
  }

  // These patterns are optional for newer Claude Code versions
  const objArrPat = /\[(?:\{label:"(?:Dark|Light).+?",value:".+?"\},?)+\]/;
  const objPat = /return\{(?:[$\w]+?:"(?:Dark|Light).+?",?)+\}/;
  const objArrMatch = oldFile.match(objArrPat);
  const objMatch = oldFile.match(objPat);

  // For new structure (v1.0.113+), we only need the case statement
  if (!objArrMatch || !objMatch || objArrMatch.index === undefined || objMatch.index === undefined) {
    console.log('patch: themes: using simplified theme structure (CLI v1.0.113+)');
    return {
      switchStatement: {
        startIndex: switchMatch.index,
        endIndex: switchMatch.index + switchMatch[0].length,
        identifiers: [],
      },
      objArr: null,
      obj: null,
    };
  }

  // Old structure (pre v1.0.113)
  return {
    switchStatement: {
      startIndex: switchMatch.index,
      endIndex: switchMatch.index + switchMatch[0].length,
      identifiers: [],
    },
    objArr: {
      startIndex: objArrMatch.index,
      endIndex: objArrMatch.index + objArrMatch[0].length,
    },
    obj: {
      startIndex: objMatch.index,
      endIndex: objMatch.index + objMatch[0].length,
    },
  };
}

export const writeThemes = (
  oldFile: string,
  themes: Theme[]
): string | null => {
  const locations = getThemesLocation(oldFile);
  if (!locations) {
    return null;
  }

  if (themes.length === 0) {
    return oldFile;
  }

  let newFile = oldFile;

  // Check if we're dealing with new structure (no objArr/obj)
  if (!locations.objArr || !locations.obj) {
    // New structure: just replace the case statement for "light"
    // We'll inject our theme as the light theme
    const themeColors = themes[0].colors;
    const caseStatement = `case"light":return${JSON.stringify(themeColors)};`;

    newFile =
      newFile.slice(0, locations.switchStatement.startIndex) +
      caseStatement +
      newFile.slice(locations.switchStatement.endIndex);
    showDiff(
      oldFile,
      newFile,
      caseStatement,
      locations.switchStatement.startIndex,
      locations.switchStatement.endIndex
    );

    return newFile;
  }

  // Old structure code (keep for compatibility)
  // Process in reverse order to avoid index shifting

  // Update theme mapping object (obj)
  const obj =
    'return' +
    JSON.stringify(
      Object.fromEntries(themes.map(theme => [theme.id, theme.name]))
    );
  newFile =
    newFile.slice(0, locations.obj.startIndex) +
    obj +
    newFile.slice(locations.obj.endIndex);
  showDiff(
    oldFile,
    newFile,
    obj,
    locations.obj.startIndex,
    locations.obj.endIndex
  );
  oldFile = newFile;

  // Update theme options array (objArr)
  const objArr = JSON.stringify(
    themes.map(theme => ({ label: theme.name, value: theme.id }))
  );
  newFile =
    newFile.slice(0, locations.objArr.startIndex) +
    objArr +
    newFile.slice(locations.objArr.endIndex);
  showDiff(
    oldFile,
    newFile,
    objArr,
    locations.objArr.startIndex,
    locations.objArr.endIndex
  );
  oldFile = newFile;

  // Update switch statement
  let switchStatement = `switch(${locations.switchStatement.identifiers?.[0]}){\n`;
  themes.forEach(theme => {
    switchStatement += `case"${theme.id}":return${JSON.stringify(
      theme.colors
    )};\n`;
  });
  switchStatement += `default:return${JSON.stringify(themes[0].colors)};\n}`;

  newFile =
    newFile.slice(0, locations.switchStatement.startIndex) +
    switchStatement +
    newFile.slice(locations.switchStatement.endIndex);
  showDiff(
    oldFile,
    newFile,
    switchStatement,
    locations.switchStatement.startIndex,
    locations.switchStatement.endIndex
  );

  return newFile;
};
