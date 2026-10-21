"""Append natural EN / SI / Singlish trade phrases. Keep original 5000 rows."""

from __future__ import annotations

import csv
from pathlib import Path

from app.modules.cub_intent.paths import EXPANDED_CSV, ORIGINAL_CSV

# review_status: new SI/Singlish still need a native pass. Do not claim they are certified.

NEW_ROWS: list[tuple[str, str, str, str]] = []


def add(intent: str, language: str, route: str, phrases: list[str]) -> None:
    for phrase in phrases:
        text = " ".join(phrase.split())
        if text:
            NEW_ROWS.append((text, intent, language, route))


add(
    "HOW_TO_TRADE",
    "en",
    "",
    [
        "how do I trade",
        "how to trade stocks",
        "teach me to trade",
        "I want to learn trading",
        "show me how trading works",
        "can I practise trading here",
        "what is a practice trade",
        "how trading work in wisecub",
        "learn buy and sell",
        "I wanna learn to trade",
        "trading for beginners",
        "how kids trade here",
        "explain practice trading",
        "where do I start trading",
        "help me start a trade",
    ],
)
add(
    "HOW_TO_TRADE",
    "si",
    "",
    [
        "වෙළෙඳාම් කරන්නේ කොහොමද",
        "ට්‍රේඩ් කරන්න ඉගෙන ගන්න ඕනේ",
        "කොටස් ගනුදෙනු කරන හැටි කියන්න",
        "මට ට්‍රේඩ් කරන්න උගන්නන්න",
        "අභ්‍යාස වෙළෙඳාම පටන් ගන්නේ කොහොමද",
        "බයි සෙල් කරන හැටි",
        "ළමයින්ට ට්‍රේඩ් කරන්න පුළුවන්ද",
        "වෙළෙඳපොළේ ගනුදෙනු ඉගෙන ගන්න",
        "මට ට්‍රේඩ් එකක් කරන්න ඕනේ ඉගෙනීමට",
        "කොටස් වෙළෙඳාම උගන්නන්න",
    ],
)
add(
    "HOW_TO_TRADE",
    "singlish",
    "",
    [
        "mata trade karanna igena ganna one",
        "trade karanne kohomada",
        "trading eka igena ganna udaw karanna",
        "mata trade karanna kiyala denna",
        "buy sell karanne hati kiyanna",
        "wisecub eke trade karanna puluwanda",
        "trade eka start karanne kohomada",
        "mata trading igenaganna one",
        "kids trade karanne kohomada",
        "practice trade eka mokadda",
        "trade karanna help karanna",
        "mama trade karanna hadanawa",
        "trading gana poddak kiyanna",
    ],
)

add(
    "HOW_TO_BUY",
    "en",
    "/market/terminal",
    [
        "how do I buy a stock",
        "how to buy shares",
        "I want to buy shares",
        "where is the buy button",
        "how can I purchase a practice stock",
        "buy order how",
        "how to place a buy",
        "can I buy SUNTEA",
        "steps to buy a share",
        "I wanna buy some shares",
        "buy shares in the terminal",
        "how buying works",
        "help me buy a stock",
        "how do kids buy here",
        "place a buy order",
    ],
)
add(
    "HOW_TO_BUY",
    "si",
    "/market/terminal",
    [
        "කොටසක් ගන්නේ කොහොමද",
        "බයි කරන්නේ කොහොමද",
        "ෂෙයාර් එකක් මිලදී ගන්න හැටි",
        "බයි බොත්තම කොහෙද",
        "මට කොටසක් ගන්න ඕනේ",
        "බයි ඕඩර් එකක් දාන්නේ කොහොමද",
        "අභ්‍යාස කොටස් ගන්න උදව් කරන්න",
        "කොටස් මිලදී ගන්න පියවර",
        "ටර්මිනල් එකේ ගන්නේ කොහොමද",
        "ෂෙයාර් ගන්න හැටි කියන්න",
    ],
)
add(
    "HOW_TO_BUY",
    "singlish",
    "/market/terminal",
    [
        "stock ekak buy karanne kohomada",
        "shares ganna hati kiyanna",
        "buy button eka koheda",
        "mata share ekak ganna one",
        "buy order ekak danna kohomada",
        "share ekak ganna udaw karanna",
        "buy karanna steps kiyanna",
        "terminal eke buy karanne kohomada",
        "mata buy karanna puluwanda",
        "stock ganna hati",
        "mama buy karanna hadanawa",
        "share buy karanna kiyala denna",
        "ganna eka explain karanna",
        "buy eka kohomada karanne",
    ],
)

add(
    "HOW_TO_SELL",
    "en",
    "/market/terminal",
    [
        "how do I sell a stock",
        "how to sell shares",
        "I want to sell",
        "place a sell order",
        "how to sell in the terminal",
        "sell button where",
        "can I sell my shares",
        "steps to sell",
        "help me sell",
        "how selling works here",
        "I wanna sell some",
        "how do I sell practice shares",
        "sell order how",
        "how kids sell here",
    ],
)
add(
    "HOW_TO_SELL",
    "si",
    "/market/terminal",
    [
        "කොටස් විකුණන්නේ කොහොමද",
        "සෙල් කරන්නේ කොහොමද",
        "සෙල් ඕඩර් එකක් දාන්නේ කොහොමද",
        "මට විකුණන්න ඕනේ",
        "විකුණන බොත්තම කොහෙද",
        "ෂෙයාර් විකුණන හැටි කියන්න",
        "ටර්මිනල් එකේ විකුණන්නේ කොහොමද",
        "අභ්‍යාස කොටස් විකුණන්න උදව්",
        "සෙල් කරන පියවර",
        "මගේ කොටස් විකුණන්න පුළුවන්ද",
    ],
)
add(
    "HOW_TO_SELL",
    "singlish",
    "/market/terminal",
    [
        "sell order ekak danna kohomada",
        "shares wikunanne kohomada",
        "sell karanne kohomada",
        "mata sell karanna one",
        "sell button eka koheda",
        "mage shares sell karanna puluwanda",
        "sell eka explain karanna",
        "terminal eke sell karanne kohomada",
        "wikunanna hati kiyanna",
        "sell order eka danna udaw",
        "mama sell karanna hadanawa",
        "stock ekak sell karanne kohomada",
    ],
)

add(
    "HOW_TO_CANCEL_ORDER",
    "en",
    "/market/terminal",
    [
        "how do I cancel an order",
        "cancel my buy",
        "I want to cancel the order",
        "stop this order",
        "can I cancel a practice order",
        "undo the trade",
        "cancel sell order",
        "how to cancel",
        "don't place that order",
        "remove my order",
    ],
)
add(
    "HOW_TO_CANCEL_ORDER",
    "si",
    "/market/terminal",
    [
        "ඕඩර් එකක් අවලංගු කරන්නේ කොහොමද",
        "බයි එක කැන්සල් කරන්න",
        "ගනුදෙනුව නවත්වන්න",
        "ඕඩර් එක අයින් කරන්න",
        "සෙල් එක කැන්සල් කරන්න පුළුවන්ද",
        "වැරදි ඕඩර් එක ගන්න",
    ],
)
add(
    "HOW_TO_CANCEL_ORDER",
    "singlish",
    "/market/terminal",
    [
        "order eka cancel karanne kohomada",
        "buy eka cancel karanna",
        "mata order eka naththara karanna one",
        "sell order eka cancel karanna puluwanda",
        "trade eka undo karanna",
        "order eka ayn karanna",
        "cancel karanna hati kiyanna",
        "me order eka stop karanna",
    ],
)

add(
    "ASK_ABOUT_CHART",
    "en",
    "",
    [
        "explain this chart",
        "what does the chart mean",
        "why is the line going up",
        "why is the line going down",
        "read the price chart",
        "what is this graph",
        "chart eka explain",
        "how do I read the chart",
        "is the red line a drop",
        "show me the chart meaning",
        "candles or line what is this",
        "help me understand the chart",
    ],
)
add(
    "ASK_ABOUT_CHART",
    "si",
    "",
    [
        "මේ චාට් එක පහදන්න",
        "චාට් එකේ තේරුම මොකක්ද",
        "ඉර උඩට යන්නේ ඇයි",
        "ඉර පහළට යන්නේ ඇයි",
        "මිල චාට් එක කියවන්නේ කොහොමද",
        "මේ ග්‍රාෆ් එක මොකක්ද",
        "රතු ඉර නම් මිල බැස්සද",
        "චාට් එක තේරුම් ගන්න උදව් කරන්න",
    ],
)
add(
    "ASK_ABOUT_CHART",
    "singlish",
    "",
    [
        "me chart eka explain karanna",
        "chart eke theruma mokadda",
        "line eka ihata yanawa ai",
        "line eka pahalata yanawa ai",
        "chart eka kiyawanne kohomada",
        "me graph eka mokadda",
        "red line eka drop ekakda",
        "chart eka therum ganna udaw",
        "price chart eka pahadili karanna",
        "chart eka gana kiyanna",
    ],
)

add(
    "ASK_ABOUT_PRICE",
    "en",
    "",
    [
        "what is the stock price",
        "how much is this share",
        "show the price",
        "did the price go up",
        "did the price fall",
        "current price please",
        "why did the price change",
        "is the price real",
        "practice price meaning",
        "what price should I buy",
        "watchlist prices",
    ],
)
add(
    "ASK_ABOUT_PRICE",
    "si",
    "",
    [
        "මිල කීයද",
        "මේ කොටසේ මිල කීයද",
        "මිල උඩට ගියාද",
        "මිල බැස්සද",
        "දැන් මිල පෙන්වන්න",
        "මිල වෙනස් වුණේ ඇයි",
        "මේ මිල ඇත්තද",
        "අභ්‍යාස මිල කියන්නේ මොකක්ද",
    ],
)
add(
    "ASK_ABOUT_PRICE",
    "singlish",
    "",
    [
        "me share eke price eka kiyada",
        "price eka kiyada",
        "price eka ihata giyada",
        "price eka bahida",
        "dan price eka pennanna",
        "price eka wenas una ai",
        "me price eka aththada",
        "watchlist eke price",
        "buy karanna price eka mokadda",
    ],
)

add(
    "ASK_ABOUT_COMPANY",
    "en",
    "",
    [
        "tell me about this company",
        "open company information",
        "what does this company do",
        "company page please",
        "read the company note",
        "is this company made up",
        "why this ticker",
        "company info before I buy",
        "what is SUNTEA",
        "show company details",
    ],
)
add(
    "ASK_ABOUT_COMPANY",
    "si",
    "",
    [
        "මේ සමාගම ගැන කියන්න",
        "සමාගමේ තොරතුරු අරින්න",
        "මේ සමාගම මොකද කරන්නේ",
        "ටිකර් එක ගැන කියන්න",
        "ගන්න කලින් සමාගම කියවන්න",
        "මේ සමාගම හදපු එකක්ද",
        "සමාගමේ පිටුව පෙන්වන්න",
    ],
)
add(
    "ASK_ABOUT_COMPANY",
    "singlish",
    "",
    [
        "me company eka gana kiyanna",
        "company info eka arinna",
        "me company eka mokada karanne",
        "ticker eka gana kiyanna",
        "buy karanna kalin company eka kiyawanna",
        "me company eka hadapu ekakda",
        "company page eka pennanna",
        "suntea kiyanne mokadda",
    ],
)

add(
    "ASK_ABOUT_PORTFOLIO_MONEY",
    "en",
    "/market/portfolio",
    [
        "show my portfolio",
        "what is my profit",
        "am I at a loss",
        "virtual balance",
        "how much practice money do I have",
        "my holdings",
        "did I make pretend profit",
        "portfolio value",
        "cash left",
        "show profit and loss",
        "how much virtual rupees",
        "my bag of shares",
        "open my portfolio",
    ],
)
add(
    "ASK_ABOUT_PORTFOLIO_MONEY",
    "si",
    "/market/portfolio",
    [
        "මගේ පෝට්ෆෝලියෝව පෙන්වන්න",
        "ලාභය කීයද",
        "පාඩුවක් තියෙනවද",
        "අභ්‍යාස මුදල් කීයක් තියෙනවද",
        "මගේ කොටස් මොනවද",
        "බැලන්ස් එක කීයද",
        "පෝට්ෆෝලියෝ වටිනාකම",
        "කෑෂ් ඉතිරිද",
        "ලාභය සහ පාඩුව පෙන්වන්න",
    ],
)
add(
    "ASK_ABOUT_PORTFOLIO_MONEY",
    "singlish",
    "/market/portfolio",
    [
        "mage portfolio eka pennanna",
        "profit eka kiyada",
        "mata loss ekak thiyenawada",
        "virtual balance eka kiyada",
        "mage shares monawada",
        "practice salli kiyak thiyenawada",
        "portfolio value eka",
        "cash ithurida",
        "profit loss pennanna",
        "mage bag eka pennanna",
        "holdings pennanna",
    ],
)

add(
    "MARKET_DROP_WHAT_TO_DO",
    "en",
    "",
    [
        "the market is going down what should I do",
        "price dropped what now",
        "should I sell because it fell",
        "market is falling help",
        "red day what do I do",
        "don't panic what then",
        "it dropped a lot",
        "is this a crash",
        "what to do when price falls",
        "hold or sell after a drop",
        "I'm scared the price fell",
        "should I dump after a red day",
        "hold tight after a drop",
        "share price slid what now",
        "red candles on the chart help",
        "market crash feeling what to do",
    ],
)
add(
    "MARKET_DROP_WHAT_TO_DO",
    "si",
    "",
    [
        "වෙළෙඳපොළ බසිනවා මොකද කරන්නේ",
        "මිල බැස්සා දැන් මොකද කරන්නේ",
        "විකුණන්නද බැස්සා කියලා",
        "රතු දවසක් මොකද කරන්නේ",
        "බයයි මිල බැස්සේ",
        "පැනික් වෙන්න එපා නම් මොකද කරන්නේ",
        "මිල ගොඩක් බැස්සා",
        "මේක ක්‍රෑෂ් එකක්ද",
    ],
)
add(
    "MARKET_DROP_WHAT_TO_DO",
    "singlish",
    "",
    [
        "market eka adu wenawa mokada karanne",
        "price eka bassa dan mokada karanne",
        "bassa kiyala sell karannada",
        "red day ekaka mokada karanne",
        "mata baya price eka bassa",
        "panic wennath epa nam mokada karanne",
        "price eka godak bassa",
        "meka crash ekakda",
        "drop una nam hold karannada",
        "market fall unama mokada",
        "share price slide una mokada",
        "dump karannada red una",
        "hold karanna drop ekata passe",
        "crash feeling ekaka mokada karanne",
    ],
)

add(
    "FOLLOW_UP_EXPLAIN",
    "en",
    "",
    [
        "explain that again",
        "say it once more",
        "I still don't get it",
        "more detail please",
        "can you explain more",
        "what do you mean",
        "again please",
        "slower please",
        "another example",
        "tell me that in a simpler way",
        "wait explain again",
    ],
)
add(
    "FOLLOW_UP_EXPLAIN",
    "si",
    "",
    [
        "ආයෙත් පහදන්න",
        "තවත් පැහැදිලි කරන්න",
        "තේරුණේ නැහැ ආයෙත් කියන්න",
        "සරලව කියන්න",
        "උදාහරණයක් තවක්",
        "මොකද කියන්නේ",
        "ආයෙත් හෙමින් කියන්න",
        "තව විස්තර",
    ],
)
add(
    "FOLLOW_UP_EXPLAIN",
    "singlish",
    "",
    [
        "eka thawath pahadili karanna",
        "ayeth kiyanna",
        "mata thawath therenne naha",
        "simple walata kiyanna",
        "example ekak thawath denna",
        "oyakiyanne mokadda",
        "hemin kiyanna",
        "thawath details",
        "explain eka ayeth karanna",
        "poddak ahuwe naha ayeth kiyanna",
    ],
)

add(
    "CLARIFY_CONFUSION",
    "en",
    "",
    [
        "I don't understand",
        "huh",
        "what",
        "I'm confused",
        "this is hard",
        "I don't get it",
        "wait what",
        "lost me",
        "can you help I don't get this page",
        "confused about this",
        "this page is too hard",
        "Cub I am lost",
        "please make it clearer",
        "I am stuck on this screen",
    ],
)
add(
    "CLARIFY_CONFUSION",
    "si",
    "",
    [
        "මට තේරෙන්නේ නැහැ",
        "අවුල්",
        "මොකක්ද මේ",
        "අමාරුයි",
        "තේරුණේ නෑ",
        "මට තේරුම් ගන්න බෑ",
        "මේක අමාරුයි Cub",
        "උදව් කරන්න තේරෙන්නේ නැහැ",
    ],
)
add(
    "CLARIFY_CONFUSION",
    "singlish",
    "",
    [
        "mata therenne naha",
        "mata therum ganna be",
        "awul",
        "mokakda me",
        "amarui",
        "therune na",
        "confused",
        "page eka therenne naha",
        "cub mata therenne naha",
        "help karanna therenne naha",
        "page eka amaru",
        "cub mama lost",
        "boho awul",
        "clear karanna be",
    ],
)

add(
    "OPEN_TERMINAL",
    "en",
    "/market/terminal",
    [
        "open the terminal",
        "go to the practice terminal",
        "trading screen",
        "order screen",
        "take me to buy sell page",
        "open trade terminal",
        "I want the terminal",
        "practice order page",
    ],
)
add(
    "OPEN_TERMINAL",
    "si",
    "/market/terminal",
    [
        "ටර්මිනල් එක අරින්න",
        "ගනුදෙනු තිරයට යන්න",
        "බයි සෙල් පිටුව",
        "ඕඩර් පිටුව අරින්න",
        "අභ්‍යාස ටර්මිනල් එක",
    ],
)
add(
    "OPEN_TERMINAL",
    "singlish",
    "/market/terminal",
    [
        "terminal eka arinna",
        "trade screen ekata yanna",
        "buy sell page eka",
        "order page eka arinna",
        "practice terminal eka",
        "mata terminal eka one",
    ],
)

add(
    "ASK_BEHAVIOUR_LESSON",
    "en",
    "/market/portfolio",
    [
        "what is herd behaviour",
        "what is panic selling",
        "impulsive investing meaning",
        "decision patterns",
        "behaviour quiz",
        "why did Cub flag me",
        "overconfidence meaning",
        "insufficient research meaning",
        "show decision patterns",
        "practice behaviour lesson",
    ],
)
add(
    "ASK_BEHAVIOUR_LESSON",
    "si",
    "/market/portfolio",
    [
        "හර්ඩ් බිහේවියර් කියන්නේ මොකක්ද",
        "පැනික් සෙලිං කියන්නේ මොකක්ද",
        "ඩිසිෂන් පැටර්න් පෙන්වන්න",
        "චර්යා පාඩම",
        "ඕවර්කොන්ෆිඩන්ස් කියන්නේ මොකක්ද",
        "Cub ඇයි ෆ්ලැග් කළේ",
    ],
)
add(
    "ASK_BEHAVIOUR_LESSON",
    "singlish",
    "/market/portfolio",
    [
        "herd behaviour kiyanne mokadda",
        "panic selling kiyanne mokadda",
        "decision patterns pennanna",
        "behaviour lesson eka",
        "overconfidence kiyanne mokadda",
        "cub ai flag kale",
        "impulsive investing gana kiyanna",
    ],
)

# Extra natural variants for existing market intents (no Please-Please wrappers).
add(
    "OPEN_STOCK_MARKET",
    "singlish",
    "/market",
    [
        "market ekata yanna",
        "stock market eka arinna",
        "mata trading ekata yanna one",
        "market floor eka",
        "kootas welaapola",
        "go trading",
        "open market eka",
    ],
)
add(
    "OPEN_STOCK_MARKET",
    "en",
    "/market",
    [
        "I want to go to trading",
        "take me to trading",
        "go to trading",
        "open trading",
        "let's go to the market",
        "market please",
        "stocks page",
    ],
)
add(
    "OPEN_STOCK_MARKET",
    "si",
    "/market",
    [
        "වෙළෙඳපොළට යමු",
        "ට්‍රේඩින් එකට යන්න",
        "කොටස් පිටුව අරින්න",
        "මට වෙළෙඳපොළ ඕනේ",
    ],
)
add(
    "OPEN_PORTFOLIO",
    "singlish",
    "/market/portfolio",
    [
        "portfolio ekata yanna",
        "mage portfolio arinna",
        "holdings page eka",
    ],
)
add(
    "EXPLAIN_RISK",
    "singlish",
    "",
    [
        "risk eka mokadda",
        "investment risk gana kiyanna",
        "price eka wenas wena eka bayaida",
    ],
)
add(
    "EXPLAIN_DIVERSIFICATION",
    "singlish",
    "",
    [
        "diversification kiyanne mokadda",
        "eka company ekata wada bedanna one ai",
        "spread karanna kiyanne mokadda",
    ],
)
add(
    "ASK_FOR_HELP",
    "singlish",
    "",
    [
        "cub udaw karanna",
        "mata help one",
        "oyata puluwanda help karanna",
        "me page eke mokada karanne",
    ],
)
add(
    "OUT_OF_SCOPE",
    "singlish",
    "",
    [
        "youtube eka open karanna",
        "mama school homework karanna one",
        "real bank eke salli ganna",
        "cricket score eka kiyanna",
        "kavuda winner da",
    ],
)
add(
    "OUT_OF_SCOPE",
    "en",
    "",
    [
        "what's the weather",
        "play a song",
        "call my mum",
        "who won the match",
        "do my maths homework",
    ],
)
add(
    "OUT_OF_SCOPE",
    "si",
    "",
    [
        "කාලගුණය කියන්න",
        "සින්දුවක් දාන්න",
        "අම්මට කතා කරන්න",
        "ගණිත ගෙදර වැඩ කරන්න",
        "ක්‍රිකට් ලකුණු කීයද",
    ],
)


def build_expanded_csv() -> Path:
    EXPANDED_CSV.parent.mkdir(parents=True, exist_ok=True)
    with ORIGINAL_CSV.open(encoding="utf-8-sig", newline="") as handle:
        original = list(csv.DictReader(handle))
    fieldnames = ["text", "intent", "language", "target_route", "split", "example_type", "review_status"]
    seen = {(row["text"].strip().lower(), row["intent"], row["language"]) for row in original}
    extra: list[dict[str, str]] = []
    for text, intent, language, route in NEW_ROWS:
        key = (text.lower(), intent, language)
        if key in seen:
            continue
        seen.add(key)
        extra.append(
            {
                "text": text,
                "intent": intent,
                "language": language,
                "target_route": route,
                "split": "",
                "example_type": "authored_classroom_example",
                "review_status": "needs_native_speaker_review" if language != "en" else "needs_project_validation",
            }
        )
    with EXPANDED_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in original:
            writer.writerow({name: row.get(name, "") for name in fieldnames})
        writer.writerows(extra)
    return EXPANDED_CSV


if __name__ == "__main__":
    path = build_expanded_csv()
    print("wrote", path, "new_rows", len(NEW_ROWS))
