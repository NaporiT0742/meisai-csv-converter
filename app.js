(function () {
  "use strict";

  var MAX_FILE_SIZE = 5 * 1024 * 1024;
  var roleLabels = { date: "日付", description: "摘要", amount: "金額", withdrawal: "出金", deposit: "入金", balance: "残高", memo: "メモ" };
  var modeLabels = {
    deposit_withdrawal: "入金・出金の2列方式",
    single_signed: "符号付きの金額1列方式",
    single_positive: "符号なしの金額1列方式（全件を出金として変換）",
    withdrawal_only: "出金1列方式",
    deposit_only: "入金1列方式"
  };
  var fileInput = document.getElementById("file-input");
  var dropZone = document.getElementById("drop-zone");
  var errorBox = document.getElementById("error-box");
  var resultSection = document.getElementById("results");
  var detectionBody = document.getElementById("detection-body");
  var summaryGrid = document.getElementById("summary-grid");
  var previewBody = document.getElementById("preview-body");
  var previewMore = document.getElementById("preview-more");
  var issueSection = document.getElementById("issues-section");
  var issuesBody = document.getElementById("issues-body");
  var signWarning = document.getElementById("sign-warning");
  var failedWarning = document.getElementById("failed-warning");
  var downloadButton = document.getElementById("download-button");
  var currentRecords = [];

  function clearElement(element) {
    while (element.firstChild) { element.removeChild(element.firstChild); }
  }

  function textCell(tag, value) {
    var item = document.createElement(tag);
    item.textContent = value;
    return item;
  }

  function showError(title, action) {
    document.getElementById("error-title").textContent = title;
    document.getElementById("error-action").textContent = action;
    errorBox.hidden = false;
    resultSection.hidden = true;
  }

  function resetMessages() {
    errorBox.hidden = true;
    signWarning.hidden = true;
    failedWarning.hidden = true;
  }

  function formatYen(value) { return new Intl.NumberFormat("ja-JP").format(value) + "円"; }
  function encodingLabel(value) {
    if (value === "utf-8-sig") { return "UTF-8（BOM付き）"; }
    if (value === "cp932") { return "Shift_JIS（CP932）"; }
    return "UTF-8";
  }

  function renderDetection(decoded, rows, layout) {
    clearElement(detectionBody);
    var facts = [
      ["文字コード", encodingLabel(decoded.encoding)],
      ["見出し行", String(layout.headerIndex + 1) + "行目"],
      ["金額の持ち方", modeLabels[layout.amountMode] + " — " + layout.reason]
    ];
    facts.forEach(function (fact) {
      var tr = document.createElement("tr");
      tr.appendChild(textCell("th", fact[0]));
      tr.appendChild(textCell("td", fact[1]));
      detectionBody.appendChild(tr);
    });
    Object.keys(roleLabels).forEach(function (role) {
      var index = layout.columns[role];
      if (index < 0) { return; }
      var tr = document.createElement("tr");
      tr.appendChild(textCell("th", roleLabels[role] + "列"));
      tr.appendChild(textCell("td", String(index + 1) + "列目「" + rows[layout.headerIndex][index] + "」"));
      detectionBody.appendChild(tr);
    });
  }

  function renderSummary(summary) {
    clearElement(summaryGrid);
    [
      ["読込行数", String(summary.totalRows) + "行"],
      ["変換できた行数", String(summary.converted) + "行"],
      ["読めなかった行数", String(summary.failed) + "行"],
      ["期間", summary.dateFrom ? summary.dateFrom + " 〜 " + summary.dateTo : "—"],
      ["入金合計", formatYen(summary.deposit)],
      ["出金合計", formatYen(summary.withdrawal)],
      ["差引", formatYen(summary.net)]
    ].forEach(function (item) {
      var wrapper = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = item[0]; dd.textContent = item[1];
      wrapper.appendChild(dt); wrapper.appendChild(dd); summaryGrid.appendChild(wrapper);
    });
  }

  function renderPreview(records) {
    clearElement(previewBody);
    records.slice(0, 100).forEach(function (record) {
      var tr = document.createElement("tr");
      tr.appendChild(textCell("td", record.date));
      tr.appendChild(textCell("td", record.description));
      var amount = textCell("td", String(record.amount));
      amount.className = record.amount < 0 ? "amount-negative" : "amount-positive";
      tr.appendChild(amount); previewBody.appendChild(tr);
    });
    previewMore.textContent = records.length > 100 ? "ほか " + String(records.length - 100) + " 行" : "";
  }

  function renderIssues(issues) {
    clearElement(issuesBody);
    issueSection.hidden = issues.length === 0;
    issues.forEach(function (issue) {
      var tr = document.createElement("tr");
      tr.appendChild(textCell("td", String(issue.row)));
      tr.appendChild(textCell("td", issue.reason));
      tr.appendChild(textCell("td", issue.raw.join(" | ")));
      issuesBody.appendChild(tr);
    });
    if (issues.length) {
      failedWarning.textContent = String(issues.length) + "行を変換できませんでした。取り込む前に元の明細と合計を突き合わせてください。";
      failedWarning.hidden = false;
    }
  }

  function processBytes(bytes) {
    resetMessages();
    var decoded;
    var rows;
    try {
      decoded = MeisaiConvert.decodeBytes(bytes);
      rows = MeisaiConvert.parseCsv(decoded.text);
    } catch (error) {
      showError("CSVの内容を読み取れませんでした。", "CSV形式で保存し直してから、もう一度ファイルを選んでください。");
      return;
    }
    if (!rows.length || rows.every(function (row) { return row.every(function (item) { return !String(item).trim(); }); })) {
      showError("明細の行が0行でした。", "内容の入ったCSVファイルを選んでください。");
      return;
    }
    var layout = MeisaiConvert.detectLayout(rows);
    if (layout.headerIndex < 0) {
      var firstRow = rows[0].map(function (value) { return "「" + value + "」"; }).join(" / ");
      showError(
        "見出し行を見つけられませんでした。読み取れた1行目: " + firstRow,
        "日付と金額にあたる列名があるCSVか確認し、先頭20行以内に見出し行を置いてください。"
      );
      return;
    }
    var converted = MeisaiConvert.convert(rows, layout);
    if (!converted.records.length) {
      showError("変換できる明細が0行でした。", "読めなかった行の原因を確認し、日付と金額の表記を直してからもう一度選んでください。");
      return;
    }
    currentRecords = converted.records;
    renderDetection(decoded, rows, layout);
    renderSummary(converted.summary);
    renderPreview(converted.records);
    renderIssues(converted.issues);
    if (layout.amountMode === "single_positive") {
      signWarning.textContent = "この明細は金額が1列で符号がないため、全件を出金として扱いました。入金が含まれる明細では符号が逆になります。";
      signWarning.hidden = false;
    }
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function readFile(file) {
    if (!file) { return; }
    if (file.size > MAX_FILE_SIZE) {
      showError("ファイルが5MBを超えています。", "ブラウザ版は5MBまでです。明細を期間ごとに分けたCSVを選んでください。");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { processBytes(new Uint8Array(reader.result)); };
    reader.onerror = function () {
      showError("ファイルを読み込めませんでした。", "ファイルが別のアプリで使用中でないか確認して、もう一度選んでください。");
    };
    reader.readAsArrayBuffer(file);
  }

  fileInput.addEventListener("change", function () { readFile(fileInput.files[0]); fileInput.value = ""; });
  ["dragenter", "dragover"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault(); dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault(); dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", function (event) { readFile(event.dataTransfer.files[0]); });
  document.querySelectorAll("[data-sample]").forEach(function (button) {
    button.addEventListener("click", function () {
      try { processBytes(MeisaiSamples.toBytes(button.getAttribute("data-sample"))); }
      catch (error) { showError("サンプルを読み込めませんでした。", "ページを再読み込みして、もう一度サンプルボタンを押してください。"); }
    });
  });
  downloadButton.addEventListener("click", function () {
    if (!currentRecords.length) { return; }
    var csv = "\ufeff" + MeisaiConvert.toCsv(currentRecords);
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = "converted_meisai.csv";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  });
}());
