class Sheet {
  constructor(config) {
    this.config = config;
    const configProcessor = new SheetConfigProcessor(this.config);
    configProcessor.process();
    this.name = this.config.name;
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.range = this.config.range || 'A:Z';
    this.values = false;
    this.titleSectionsLeftMarker =   'TITLE_LEFT';
    this.titleSectionsRightMarker =  'TITLE_RIGHT';
    this.headerSectionsLeftMarker =  'HEADER_LEFT';
    this.headerSectionsRightMarker = 'HEADER_RIGHT';
    this.mainSectionBeginMarker =    'MAIN_BEGIN';
    this.mainSectionEndMarker =      'MAIN_END';
    this.doneSectionBeginMarker =    'DONE_BEGIN';
    this.doneSectionEndMarker =      'DONE_END';
  }

  getRangeOfRow(row) {
    const beginColumn = 1;
    const numRows = 1;
    const numColumns = this.getDataRange().getNumColumns();
    return this.sheetRef.getRange(row, beginColumn, numRows, numColumns);
  }

  getRangeOfRows(beginRow, endRow) {
    const beginColumn = 1;
    const numRows = endRow - beginRow + 1;
    const numColumns = this.getDataRange().getNumColumns();
    return this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
  }

  getTitleSectionRanges() {
    let ranges = [];
    const leftMarkerRanges = this.getDataRange().createTextFinder(this.titleSectionsLeftMarker).findAll();
    const rightMarkerRanges = this.getDataRange().createTextFinder(this.titleSectionsRightMarker).findAll();
    let leftMarkerRow = 1; let rightMarkerRow = 1; let leftMarkerColumn = 1; let rightMarkerColumn = 1; let row = 1; let column = 1; let numRows = 1; let numColumns = 1;

    if(leftMarkerRanges.length === rightMarkerRanges.length) {
      for(let i = 0; i < leftMarkerRanges.length; i++) {
        leftMarkerRow = leftMarkerRanges[i].getRow();
        rightMarkerRow = rightMarkerRanges[i].getRow();
        leftMarkerColumn = leftMarkerRanges[i].getColumn();
        rightMarkerColumn = rightMarkerRanges[i].getColumn();

        if(leftMarkerRow === rightMarkerRow || leftMarkerColumn + 2 !== rightMarkerColumn) {
          row = leftMarkerRow;
          column = leftMarkerColumn + 1;
          ranges.push(this.sheetRef.getRange(row, column, numRows, numColumns));
        } else {
          logError('Title markers not aligned or positioned correctly');
        }
      }
    } else {
      logError('Title markers not found in pairs');
    }
    return ranges;
  }

  getHeaderSectionRanges() {
    let ranges = [];
    const leftMarkerRanges = this.getDataRange().createTextFinder(this.headerSectionsLeftMarker).findAll();
    const rightMarkerRanges = this.getDataRange().createTextFinder(this.headerSectionsRightMarker).findAll();
    let leftMarkerRow = 1; let rightMarkerRow = 1; let leftColumn = 1; let rightColumn = 1; let row = 1; let numRows = 1; let numColumns = 1;

    if(leftMarkerRanges.length === rightMarkerRanges.length) {
      for(let i = 0; i < leftMarkerRanges.length; i++) {
        leftMarkerRow = leftMarkerRanges[i].getRow();
        rightMarkerRow = rightMarkerRanges[i].getRow();

        if(leftMarkerRow === rightMarkerRow) {
          row = leftMarkerRow;
          leftColumn = leftMarkerRanges[i].getColumn() + 1;
          rightColumn = rightMarkerRanges[i].getColumn() - 1;
          numColumns = rightColumn - leftColumn + 1;
          ranges.push(this.sheetRef.getRange(row, leftColumn, numRows, numColumns));
        } else {
          logError('Header markers not aligned');
        }
      }
    } else {
      logError('Header markers not found in pairs');
    }
    return ranges;
  }

  getMainSectionRange() {
    const beginRow = this.getMainSectionBeginRow();
    const numRows = this.getMainSectionEndRow() - beginRow + 1;
    const beginColumn = this.getContentSectionsBeginColumn();
    const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
    return this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
  }

  getDoneSectionRange() {
    const beginRow = this.getDoneSectionBeginRow();
    const numRows = this.getDoneSectionEndRow() - beginRow + 1;
    const beginColumn = this.getContentSectionsBeginColumn();
    const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
    return this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
  }

  getMainSectionRowsRange(beginOffset=0, endOffset=0) {
    return this.getRangeOfRows(this.getMainSectionBeginRow() + beginOffset, this.getMainSectionEndRow() + endOffset);
  }

  getDoneSectionRowsRange(beginOffset=0, endOffset=0) {
    return this.getRangeOfRows(this.getDoneSectionBeginRow() + beginOffset, this.getDoneSectionEndRow() + endOffset);
  }

  getMainSectionBeginRow() {
    return this.lookupRowIndex(this.mainSectionBeginMarker, 2);
  }

  getMainSectionEndRow() {
    return this.lookupRowIndex(this.mainSectionEndMarker, -1);
  }

  getMainSectionNumRows() {
    return this.getMainSectionEndRow() - this.getMainSectionBeginRow() + 1;
  }

  getDoneSectionBeginRow() {
    return this.lookupRowIndex(this.doneSectionBeginMarker, 2);
  }

  getDoneSectionEndRow() {
    return this.lookupRowIndex(this.doneSectionEndMarker, -1);
  }

  getDoneSectionNumRows() {
    return this.getDoneSectionEndRow() - this.getDoneSectionBeginRow() + 1;
  }

  getContentSectionsBeginColumn() {
    return this.getDataRange().createTextFinder(this.headerSectionsLeftMarker).findNext().getColumn() + 1;
  }

  getContentSectionsEndColumn() {
    return this.getDataRange().createTextFinder(this.headerSectionsRightMarker).findNext().getColumn() - 1;
  }

  getUnderContentSectionRanges() {
    let ranges = [];
    const mainSectionEndMarkerRow = this.lookupRowIndex(this.mainSectionEndMarker);
    const doneSectionEndMarkerRow = this.lookupRowIndex(this.doneSectionEndMarker);
    const numRows = 1;
    const beginColumn = this.getContentSectionsBeginColumn();
    const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
    ranges.push(this.sheetRef.getRange(mainSectionEndMarkerRow, beginColumn, numRows, numColumns));
    ranges.push(this.sheetRef.getRange(doneSectionEndMarkerRow, beginColumn, numRows, numColumns));
    return ranges;
  }

  lookupRowIndex(marker, offset=0) {
    return this.getDataRange().createTextFinder(marker).findNext().getRow() + offset;
  }

  retrieveValuesFromSheet() {
    this.values = this.getDataRange().getValues();
    return this.values;
  }

  getValues() {
    return this.values || this.retrieveValuesFromSheet();
  }

  retrieveDataRangeFromSheet() {
    this.dataRange = this.sheetRef.getDataRange();
    return this.dataRange;
  }

  getDataRange() {
    return this.dataRange || this.retrieveDataRangeFromSheet();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends Sheet {
  constructor(config) {
    super(config);
  }

  retrieveValuesFromSheet() {
    this.values = this.sheetRef.getRange(this.range).getValues();
    return this.values;
  }

  getValuesOf(columnID) {
    return this.getValues().map((value) => { return value[columnID]; });
  }

  getValueOf(rowId, columnID) {
    return this.getValues()[rowId][columnID];
  }
}

class FeatureSheet extends Sheet {
  constructor(config) {
    super(config);
    this.ensureAccessExpectations();
  }

  isNamed(name) {
    return this.name === name;
  }

  isTriggeredByColumn(columnCardinalIndex) {
    return !this.hasTriggerColumns || this.triggerColumns.cardinalIndices.includes(columnCardinalIndex);
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerColumns']);
  }

  assignPropertiesFromConfig(propertyNames) {
    propertyNames.forEach((propertyName) => {
      this.assignPropertyFromConfig(propertyName);
    });
  }

  assignPropertyFromConfig(propertyName) {
    const propertyNameHasVersion = 'has' + capitalizeFirstLetter(propertyName);
    this[propertyNameHasVersion] = false;
    if(this.config.hasOwnProperty(propertyName)) {
      this[propertyName] = this.config[propertyName];
      this[propertyNameHasVersion] = true;
    }
  }
}