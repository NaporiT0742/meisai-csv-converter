(function (global) {
  "use strict";

  var HEADER_WORDS = {
    date: ["日付", "取引日", "利用日", "ご利用日", "お取引日", "年月日", "計上日", "取引年月日"],
    description: ["摘要", "内容", "利用先", "利用店名", "ご利用先", "お取引内容", "詳細", "支払先", "お店の名前"],
    amount: ["金額", "利用金額", "支払金額", "ご利用金額", "取引金額"],
    withdrawal: ["出金", "お引出", "お引出し", "引出", "支払", "払出金額", "出金金額", "お支払金額"],
    deposit: ["入金", "お預入", "お預入れ", "預入", "受入金額", "入金金額"],
    balance: ["残高", "現在高", "差引残高"],
    memo: ["メモ", "備考", "摘要2", "詳細2"]
  };

  function decodeBytes(uint8Array) {
    if (!uint8Array || uint8Array.length === 0) {
      return { text: "", encoding: "utf-8" };
    }
    var hasBom = uint8Array.length >= 3 && uint8Array[0] === 0xef && uint8Array[1] === 0xbb && uint8Array[2] === 0xbf;
    if (hasBom) {
      return { text: new TextDecoder("utf-8").decode(uint8Array.slice(3)), encoding: "utf-8-sig" };
    }
    try {
      return { text: new TextDecoder("utf-8", { fatal: true }).decode(uint8Array), encoding: "utf-8" };
    } catch (error) {
      return { text: new TextDecoder("shift_jis").decode(uint8Array), encoding: "cp932" };
    }
  }

  function parseCsv(text) {
    if (text === "") { return []; }
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
        } else { field += ch; }
      } else if (ch === '"' && field === "") {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\r" || ch === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
        if (ch === "\r" && text[i + 1] === "\n") { i += 1; }
      } else { field += ch; }
    }
    if (inQuotes) { throw new Error("ダブルクォートが閉じられていません"); }
    row.push(field); rows.push(row);
    while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") { rows.pop(); }
    return rows;
  }

  function headerKey(value) {
    return String(value == null ? "" : value).normalize("NFKC").replace(/\s/g, "");
  }

  function containsWord(value, words) {
    for (var i = 0; i < words.length; i += 1) {
      if (value.indexOf(headerKey(words[i])) !== -1) { return true; }
    }
    return false;
  }

  function blankColumns() {
    return { date: -1, description: -1, amount: -1, withdrawal: -1, deposit: -1, balance: -1, memo: -1 };
  }

  function mapColumns(row) {
    var columns = blankColumns();
    var order = ["date", "memo", "description", "withdrawal", "deposit", "balance", "amount"];
    row.forEach(function (cell, index) {
      var normalized = headerKey(cell);
      for (var i = 0; i < order.length; i += 1) {
        var role = order[i];
        if (columns[role] === -1 && containsWord(normalized, HEADER_WORDS[role])) {
          columns[role] = index;
          break;
        }
      }
    });
    return columns;
  }

  function hasNegativeMark(value) {
    var normalized = String(value == null ? "" : value).normalize("NFKC").trim();
    return /^\(.*\)$/.test(normalized) || /^[-−–—▲△]/.test(normalized) || /[-−–—▲△]$/.test(normalized);
  }

  function detectLayout(rows) {
    var limit = Math.min(rows.length, 20);
    for (var i = 0; i < limit; i += 1) {
      var columns = mapColumns(rows[i]);
      var hasAmountSeries = columns.amount >= 0 || columns.withdrawal >= 0 || columns.deposit >= 0;
      if (columns.date < 0 || !hasAmountSeries) { continue; }
      var amountMode;
      var reason;
      if (columns.withdrawal >= 0 && columns.deposit >= 0) {
        amountMode = "deposit_withdrawal";
        reason = "出金列と入金列を別々に検出しました";
      } else if (columns.amount >= 0) {
        var signed = false;
        for (var r = i + 1; r < rows.length; r += 1) {
          if (hasNegativeMark(rows[r][columns.amount])) { signed = true; break; }
        }
        amountMode = signed ? "single_signed" : "single_positive";
        reason = signed ? "1つの金額列にマイナス記号が含まれています" : "1つの金額列にマイナス記号がありません";
      } else if (columns.withdrawal >= 0) {
        amountMode = "withdrawal_only";
        reason = "出金列だけを検出しました";
      } else {
        amountMode = "deposit_only";
        reason = "入金列だけを検出しました";
      }
      return { headerIndex: i, columns: columns, amountMode: amountMode, reason: reason };
    }
    return {
      headerIndex: -1,
      columns: blankColumns(),
      amountMode: null,
      reason: "日付列と金額系列の列を持つ見出し行が先頭20行以内に見つかりませんでした"
    };
  }

  function validDate(year, month, day) {
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function formatDate(year, month, day) {
    if (!validDate(year, month, day)) { return null; }
    return String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  function normalizeDate(value) {
    var s = String(value == null ? "" : value).normalize("NFKC").trim();
    s = s.replace(/\([^)]*\)\s*$/, "").trim();
    if (!s) { return null; }
    var match = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) { return formatDate(Number(match[1]), Number(match[2]), Number(match[3])); }
    match = s.match(/^(\d{4})\s*(?:[\/\-.]|年)\s*(\d{1,2})\s*(?:[\/\-.]|月)\s*(\d{1,2})\s*日?$/);
    if (match) { return formatDate(Number(match[1]), Number(match[2]), Number(match[3])); }
    match = s.match(/^(R|H|S|令和|平成|昭和)\s*(元|\d{1,2})\s*(?:[\/\-.]|年)\s*(\d{1,2})\s*(?:[\/\-.]|月)\s*(\d{1,2})\s*日?$/i);
    if (match) {
      var era = match[1].toUpperCase();
      var eraYear = match[2] === "元" ? 1 : Number(match[2]);
      var offset = era === "R" || era === "令和" ? 2018 : era === "H" || era === "平成" ? 1988 : 1925;
      return formatDate(offset + eraYear, Number(match[3]), Number(match[4]));
    }
    return null;
  }

  function normalizeAmount(value) {
    var s = String(value == null ? "" : value).normalize("NFKC").trim();
    if (!s) { return null; }
    var negative = false;
    if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1).trim(); }
    if (/^[-−–—▲△]/.test(s)) { negative = true; s = s.slice(1); }
    if (/[-−–—▲△]$/.test(s)) { negative = true; s = s.slice(0, -1); }
    if (/^\+/.test(s)) { s = s.slice(1); }
    s = s.replace(/[,\s¥\\円]/g, "");
    if (!/^\d+$/.test(s)) { return null; }
    var amount = Number(s);
    if (!Number.isSafeInteger(amount)) { return null; }
    return negative ? -amount : amount;
  }

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cell(row, index) { return index >= 0 && index < row.length ? row[index] : ""; }
  function rowIsEmpty(row) { return row.every(function (value) { return String(value).trim() === ""; }); }

  function resolveAmount(row, layout) {
    var columns = layout.columns;
    if (layout.amountMode === "deposit_withdrawal") {
      var withdrawalRaw = cell(row, columns.withdrawal);
      var depositRaw = cell(row, columns.deposit);
      var withdrawal = normalizeAmount(withdrawalRaw);
      var deposit = normalizeAmount(depositRaw);
      if (String(withdrawalRaw).trim() && withdrawal === null) { return { amount: null, rawEmpty: false }; }
      if (String(depositRaw).trim() && deposit === null) { return { amount: null, rawEmpty: false }; }
      if (withdrawal === null && deposit === null) { return { amount: null, rawEmpty: true }; }
      return { amount: Math.abs(deposit || 0) - Math.abs(withdrawal || 0), rawEmpty: false };
    }
    var role = layout.amountMode === "withdrawal_only" ? "withdrawal" : layout.amountMode === "deposit_only" ? "deposit" : "amount";
    var raw = cell(row, columns[role]);
    var parsed = normalizeAmount(raw);
    if (parsed === null) { return { amount: null, rawEmpty: String(raw).trim() === "" }; }
    if (layout.amountMode === "single_positive" || layout.amountMode === "withdrawal_only") { parsed = -Math.abs(parsed); }
    else if (layout.amountMode === "deposit_only") { parsed = Math.abs(parsed); }
    return { amount: parsed, rawEmpty: false };
  }

  function convert(rows, layout) {
    var records = [];
    var issues = [];
    var totalRows = 0;
    if (!layout || layout.headerIndex < 0) {
      return { records: records, issues: issues, summary: { totalRows: 0, converted: 0, failed: 0, dateFrom: null, dateTo: null, deposit: 0, withdrawal: 0, net: 0 } };
    }
    for (var i = layout.headerIndex + 1; i < rows.length; i += 1) {
      var row = rows[i];
      if (rowIsEmpty(row)) { continue; }
      totalRows += 1;
      var rawDate = cell(row, layout.columns.date);
      var date = normalizeDate(rawDate);
      var amountResult = resolveAmount(row, layout);
      var reason = null;
      if (!String(rawDate).trim() && amountResult.rawEmpty) { reason = "日付と金額の両方が空です"; }
      else if (!date && amountResult.amount === null) { reason = "日付と金額を読み取れませんでした"; }
      else if (!date) { reason = "日付を読み取れませんでした"; }
      else if (amountResult.amount === null) { reason = "金額を読み取れませんでした"; }
      if (reason) {
        issues.push({ row: i + 1, reason: reason, raw: row.slice() });
        continue;
      }
      var description = normalizeText(cell(row, layout.columns.description));
      if (!description && layout.columns.memo >= 0) { description = normalizeText(cell(row, layout.columns.memo)); }
      records.push({ date: date, description: description, amount: amountResult.amount, sourceRow: i + 1 });
    }
    var dates = records.map(function (record) { return record.date; }).sort();
    var deposit = 0;
    var withdrawal = 0;
    var net = 0;
    records.forEach(function (record) {
      net += record.amount;
      if (record.amount > 0) { deposit += record.amount; }
      else if (record.amount < 0) { withdrawal += Math.abs(record.amount); }
    });
    return {
      records: records,
      issues: issues,
      summary: {
        totalRows: totalRows, converted: records.length, failed: issues.length,
        dateFrom: dates.length ? dates[0] : null, dateTo: dates.length ? dates[dates.length - 1] : null,
        deposit: deposit, withdrawal: withdrawal, net: net
      }
    };
  }

  function csvCell(value) {
    var s = String(value == null ? "" : value);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(records) {
    var lines = ["日付,摘要,金額"];
    records.forEach(function (record) {
      lines.push([csvCell(record.date), csvCell(record.description), String(record.amount)].join(","));
    });
    return lines.join("\r\n");
  }

  global.MeisaiConvert = Object.freeze({
    decodeBytes: decodeBytes,
    parseCsv: parseCsv,
    detectLayout: detectLayout,
    normalizeDate: normalizeDate,
    normalizeAmount: normalizeAmount,
    normalizeText: normalizeText,
    convert: convert,
    toCsv: toCsv
  });
}(window));
