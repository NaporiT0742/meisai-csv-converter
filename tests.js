(function () {
  "use strict";
  var tests = [];
  function test(name, fn) { tests.push({ name: name, fn: fn }); }
  function equal(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error("期待: " + JSON.stringify(expected) + " / 実際: " + JSON.stringify(actual));
    }
  }
  function ok(value, message) { if (!value) { throw new Error(message || "条件を満たしませんでした"); } }

  test("normalizeDate: スラッシュ区切り", function () { equal(MeisaiConvert.normalizeDate("2026/1/5"), "2026-01-05"); });
  test("normalizeDate: ハイフン区切り", function () { equal(MeisaiConvert.normalizeDate("2026-01-05"), "2026-01-05"); });
  test("normalizeDate: ピリオド区切り", function () { equal(MeisaiConvert.normalizeDate("2026.1.5"), "2026-01-05"); });
  test("normalizeDate: 年月日", function () { equal(MeisaiConvert.normalizeDate("2026年1月5日"), "2026-01-05"); });
  test("normalizeDate: 8桁", function () { equal(MeisaiConvert.normalizeDate("20260105"), "2026-01-05"); });
  test("normalizeDate: R表記", function () { equal(MeisaiConvert.normalizeDate("R8.1.5"), "2026-01-05"); });
  test("normalizeDate: Rスラッシュ", function () { equal(MeisaiConvert.normalizeDate("R8/1/5"), "2026-01-05"); });
  test("normalizeDate: 令和表記", function () { equal(MeisaiConvert.normalizeDate("令和8年1月5日"), "2026-01-05"); });
  test("normalizeDate: 令和ピリオド", function () { equal(MeisaiConvert.normalizeDate("令和8.1.5"), "2026-01-05"); });
  test("normalizeDate: 平成", function () { equal(MeisaiConvert.normalizeDate("平成31年4月30日"), "2019-04-30"); });
  test("normalizeDate: 昭和", function () { equal(MeisaiConvert.normalizeDate("S63.1.1"), "1988-01-01"); });
  test("normalizeDate: 元年", function () { equal(MeisaiConvert.normalizeDate("R元年5月1日"), "2019-05-01"); });
  test("normalizeDate: 全角", function () { equal(MeisaiConvert.normalizeDate("２０２６／１／５"), "2026-01-05"); });
  test("normalizeDate: 曜日付き", function () { equal(MeisaiConvert.normalizeDate(" 2026/1/5(月) "), "2026-01-05"); });
  test("normalizeDate: 不正日付", function () { equal(MeisaiConvert.normalizeDate("2026-02-30"), null); });
  test("normalizeDate: 空文字", function () { equal(MeisaiConvert.normalizeDate(""), null); });

  test("normalizeAmount: カンマ", function () { equal(MeisaiConvert.normalizeAmount("1,234"), 1234); });
  test("normalizeAmount: 全角", function () { equal(MeisaiConvert.normalizeAmount("１，２３４"), 1234); });
  test("normalizeAmount: △", function () { equal(MeisaiConvert.normalizeAmount("△440"), -440); });
  test("normalizeAmount: ▲", function () { equal(MeisaiConvert.normalizeAmount("▲500"), -500); });
  test("normalizeAmount: 括弧", function () { equal(MeisaiConvert.normalizeAmount("(1,000)"), -1000); });
  test("normalizeAmount: 末尾マイナス", function () { equal(MeisaiConvert.normalizeAmount("900-"), -900); });
  test("normalizeAmount: 円記号", function () { equal(MeisaiConvert.normalizeAmount("¥ 2,500円"), 2500); });
  test("normalizeAmount: バックスラッシュ", function () { equal(MeisaiConvert.normalizeAmount("\\3,000"), 3000); });
  test("normalizeAmount: 空文字", function () { equal(MeisaiConvert.normalizeAmount(" "), null); });
  test("normalizeAmount: 0", function () { equal(MeisaiConvert.normalizeAmount("0"), 0); });
  test("normalizeAmount: 小数を拒否", function () { equal(MeisaiConvert.normalizeAmount("12.5"), null); });
  test("normalizeAmount: 非数値を拒否", function () { equal(MeisaiConvert.normalizeAmount("金額未定"), null); });

  test("normalizeText: 半角カナ", function () { equal(MeisaiConvert.normalizeText("ﾃｽﾄ"), "テスト"); });
  test("normalizeText: 全角英数", function () { equal(MeisaiConvert.normalizeText("ＡＢＣ１２３"), "ABC123"); });
  test("normalizeText: 連続空白", function () { equal(MeisaiConvert.normalizeText("  A　 B   C  "), "A B C"); });
  test("normalizeText: 制御文字", function () { equal(MeisaiConvert.normalizeText("A\u0000B\u0007C"), "ABC"); });

  test("parseCsv: クォート内カンマ", function () { equal(MeisaiConvert.parseCsv('a,"b,c",d'), [["a", "b,c", "d"]]); });
  test("parseCsv: クォート内改行", function () { equal(MeisaiConvert.parseCsv('a,"b\nc",d'), [["a", "b\nc", "d"]]); });
  test("parseCsv: 二重クォート", function () { equal(MeisaiConvert.parseCsv('a,"b""c"'), [["a", 'b"c']]); });
  test("parseCsv: CRLF", function () { equal(MeisaiConvert.parseCsv("a,b\r\nc,d"), [["a", "b"], ["c", "d"]]); });
  test("parseCsv: CR", function () { equal(MeisaiConvert.parseCsv("a,b\rc,d"), [["a", "b"], ["c", "d"]]); });
  test("parseCsv: 末尾空行", function () { equal(MeisaiConvert.parseCsv("a,b\n\n"), [["a", "b"]]); });
  test("parseCsv: 途中の空行", function () { equal(MeisaiConvert.parseCsv("a,b\n\nc,d"), [["a", "b"], [""], ["c", "d"]]); });
  test("parseCsv: 閉じていないクォートを拒否", function () {
    var failed = false;
    try { MeisaiConvert.parseCsv('a,"b'); } catch (error) { failed = true; }
    ok(failed, "不正なCSVを受理しました");
  });
  test("parseCsv: 空文字", function () { equal(MeisaiConvert.parseCsv(""), []); });

  test("decodeBytes: UTF-8 BOM", function () {
    equal(MeisaiConvert.decodeBytes(new Uint8Array([0xef, 0xbb, 0xbf, 0x41])), { text: "A", encoding: "utf-8-sig" });
  });
  test("decodeBytes: UTF-8", function () {
    equal(MeisaiConvert.decodeBytes(new Uint8Array([0xe3, 0x81, 0x82])), { text: "あ", encoding: "utf-8" });
  });
  test("decodeBytes: CP932", function () {
    equal(MeisaiConvert.decodeBytes(new Uint8Array([0x93, 0xfa, 0x95, 0x74])), { text: "日付", encoding: "cp932" });
  });
  test("decodeBytes: 空配列", function () { equal(MeisaiConvert.decodeBytes(new Uint8Array([])), { text: "", encoding: "utf-8" }); });

  test("detectLayout: 入出金2列", function () {
    var layout = MeisaiConvert.detectLayout([["日付", "摘要", "出金金額", "入金金額"]]);
    equal(layout.amountMode, "deposit_withdrawal");
    equal(layout.columns.amount, -1);
    equal([layout.columns.withdrawal, layout.columns.deposit], [2, 3]);
  });
  test("detectLayout: 支払先は摘要列", function () {
    var layout = MeisaiConvert.detectLayout([["日付", "支払先", "金額"]]);
    equal([layout.columns.description, layout.columns.withdrawal, layout.columns.amount], [1, -1, 2]);
  });
  test("detectLayout: 支払金額は出金列", function () {
    var layout = MeisaiConvert.detectLayout([["日付", "内容", "支払金額"]]);
    equal([layout.columns.description, layout.columns.withdrawal, layout.columns.amount], [1, 2, -1]);
  });
  test("detectLayout: 金額1列符号あり", function () {
    equal(MeisaiConvert.detectLayout([["取引日", "詳細", "金額"], ["2026/1/1", "例", "△100"]]).amountMode, "single_signed");
  });
  test("detectLayout: 金額1列符号なし", function () {
    equal(MeisaiConvert.detectLayout([["利用日", "利用先", "金額"], ["2026/1/1", "例", "100"]]).amountMode, "single_positive");
  });
  test("detectLayout: 前置き行", function () {
    equal(MeisaiConvert.detectLayout([["架空明細"], ["日付", "摘要", "金額"]]).headerIndex, 1);
  });
  test("detectLayout: 見つからない", function () { equal(MeisaiConvert.detectLayout([["名前", "番号"]]).headerIndex, -1); });

  test("convert: 入出金の符号と行番号", function () {
    var rows = [["注記"], ["日付", "摘要", "出金", "入金"], ["2026/1/5", "買物", "100", ""], ["2026/1/6", "返金", "", "50"]];
    var result = MeisaiConvert.convert(rows, MeisaiConvert.detectLayout(rows));
    equal(result.records.map(function (record) { return [record.amount, record.sourceRow]; }), [[-100, 3], [50, 4]]);
  });
  test("convert: issues", function () {
    var rows = [["日付", "摘要", "金額"], ["不明", "例", "100"]];
    var result = MeisaiConvert.convert(rows, MeisaiConvert.detectLayout(rows));
    equal(result.issues[0].reason, "日付を読み取れませんでした");
    equal(result.issues[0].row, 2);
  });
  test("convert: summary", function () {
    var rows = [["日付", "摘要", "金額"], ["2026/1/5", "A", "-100"], ["2026/1/7", "B", "300"], ["不正", "C", "10"]];
    var result = MeisaiConvert.convert(rows, MeisaiConvert.detectLayout(rows));
    equal(result.summary, { totalRows: 3, converted: 2, failed: 1, dateFrom: "2026-01-05", dateTo: "2026-01-07", deposit: 300, withdrawal: 100, net: 200 });
  });
  test("toCsv: CRLFと必要なクォート", function () {
    equal(MeisaiConvert.toCsv([{ date: "2026-01-05", description: 'A, "B"', amount: -1200 }]), '日付,摘要,金額\r\n2026-01-05,"A, ""B""",-1200');
  });

  test("sample: 銀行はCP932・入出金2列", function () {
    var decoded = MeisaiConvert.decodeBytes(MeisaiSamples.toBytes("bank"));
    var rows = MeisaiConvert.parseCsv(decoded.text);
    var layout = MeisaiConvert.detectLayout(rows);
    var result = MeisaiConvert.convert(rows, layout);
    equal(decoded.encoding, "cp932");
    equal(layout.amountMode, "deposit_withdrawal");
    ok(result.records.some(function (record) { return record.amount < 0; }), "出金がありません");
    ok(result.records.some(function (record) { return record.amount > 0; }), "入金がありません");
  });
  test("sample: カードはBOM・single_positive", function () {
    var decoded = MeisaiConvert.decodeBytes(MeisaiSamples.toBytes("card"));
    var rows = MeisaiConvert.parseCsv(decoded.text);
    var layout = MeisaiConvert.detectLayout(rows);
    equal([decoded.encoding, layout.amountMode], ["utf-8-sig", "single_positive"]);
    ok(MeisaiConvert.convert(rows, layout).records.every(function (record) { return record.amount <= 0; }), "全件出金ではありません");
  });
  test("sample: ネット銀行の△440と全角数字", function () {
    var decoded = MeisaiConvert.decodeBytes(MeisaiSamples.toBytes("netbank"));
    var rows = MeisaiConvert.parseCsv(decoded.text);
    var result = MeisaiConvert.convert(rows, MeisaiConvert.detectLayout(rows));
    ok(result.records.some(function (record) { return record.amount === -440; }), "-440へ変換された行がありません");
    ok(result.records.some(function (record) { return record.amount === 1250; }), "全角数字の入金が変換されていません");
  });

  var pass = 0;
  var failures = [];
  var list = document.getElementById("test-results");
  tests.forEach(function (entry) {
    var li = document.createElement("li");
    try {
      entry.fn(); pass += 1; li.textContent = "PASS: " + entry.name; li.className = "test-pass";
    } catch (error) {
      failures.push({ name: entry.name, message: error.message });
      li.textContent = "FAIL: " + entry.name + " — " + error.message; li.className = "test-fail";
    }
    list.appendChild(li);
  });
  var fail = failures.length;
  document.getElementById("test-pass").textContent = "合格: " + String(pass);
  document.getElementById("test-fail").textContent = "不合格: " + String(fail);
  document.getElementById("test-status").textContent = fail === 0 ? "すべてのテストに合格しました。" : "不合格の詳細を確認してください。";
  document.title = fail === 0 ? "PASS " + String(pass) + "/" + String(tests.length) : "FAIL " + String(fail) + "/" + String(tests.length);
  window.__TEST_RESULT__ = { pass: pass, fail: fail, failures: failures };
}());
