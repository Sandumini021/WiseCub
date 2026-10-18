"""One-off generator for the teammate MongoDB handout PDF."""

from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

OUT = Path(__file__).with_name("WiseCub-MongoDB-teammate-setup.pdf")


class Handout(FPDF):
    def header(self) -> None:
        self.set_fill_color(15, 76, 58)
        self.rect(0, 0, 210, 22, "F")
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 14)
        self.set_xy(12, 6)
        self.cell(0, 6, "WiseCub  |  J26-IT-418", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Helvetica", "", 10)
        self.set_x(12)
        self.cell(0, 5, "Local MongoDB setup for teammates")
        self.ln(12)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "Do not commit .env  |  Do not share this over the public internet  |  Page " + str(self.page_no()), align="C")

    def heading(self, text: str) -> None:
        self.ln(3)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(15, 76, 58)
        self.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(30, 30, 30)

    def p(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def bullet(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        x = self.get_x()
        self.cell(6, 5, "-")
        self.multi_cell(0, 5, text)
        self.set_x(x)

    def code(self, text: str) -> None:
        self.set_fill_color(240, 244, 241)
        self.set_font("Courier", "", 9)
        self.multi_cell(0, 5, text, fill=True)
        self.ln(2)


def build() -> None:
    pdf = Handout()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_left_margin(14)
    pdf.set_right_margin(14)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.p(
        "Each teammate runs MongoDB on their own laptop. "
        "localhost:27017 means THIS computer only. You cannot connect to another member's Compass from your PC."
    )

    pdf.heading("1. Install the tools")
    pdf.bullet("MongoDB Community Server (so mongod can run), OR a portable MongoDB zip.")
    pdf.bullet("MongoDB Compass (the window used to view data). Download: https://www.mongodb.com/try/download/compass")
    pdf.bullet("The WiseCub repo, your feature branch, and a copy of .env.example saved as .env")

    pdf.heading("2. Start MongoDB on your laptop")
    pdf.p("Mongo must be running before Compass and before the WiseCub API.")
    pdf.p("If you installed MongoDB as a Windows service, it often starts by itself. If Compass cannot connect, start it in PowerShell:")
    pdf.code(
        "mongod --dbpath C:\\data\\db --bind_ip 127.0.0.1 --port 27017"
    )
    pdf.p("Create the folder C:\\data\\db first if it does not exist. Keep this window/process running.")

    pdf.heading("3. Connect Compass")
    pdf.bullet("Open MongoDB Compass.")
    pdf.bullet("Click Add new connection.")
    pdf.bullet("Paste this URI exactly (one line, no extra spaces):")
    pdf.code("mongodb://localhost:27017")
    pdf.bullet("Name (optional): WiseCub local")
    pdf.bullet("Click Save & Connect.")
    pdf.bullet("Ignore Atlas / cloud help text. We are using a local database.")
    pdf.p("After connect, you should see databases on the left. WiseCub data is under: wisecub")

    pdf.heading("4. Point the WiseCub API at Mongo")
    pdf.p("In the project root, copy .env.example to .env if you do not have .env yet. Put these lines in .env:")
    pdf.code(
        "MONGODB_URI=mongodb://localhost:27017\n"
        "MONGODB_DB=wisecub"
    )
    pdf.p("Never commit .env to GitHub. Never put a password in the group chat unless you are using Atlas (section 8).")

    pdf.heading("5. Start the API and check it")
    pdf.code(
        "cd backend\n"
        ".venv\\Scripts\\activate\n"
        "pip install -r requirements.txt\n"
        "uvicorn app.main:app --reload --port 8000"
    )
    pdf.p("Open this in a browser:")
    pdf.code("http://localhost:8000/health")
    pdf.p('You want:  "database": "connected"')
    pdf.p('If you see "database": "down", Mongo is not running. Start mongod, then restart the API.')

    pdf.add_page()
    pdf.heading("6. What you will see in Compass")
    pdf.p("Database name: wisecub")
    pdf.p("Collections (created after the first save):")
    pdf.bullet("children  - demo child name after Login")
    pdf.bullet("module_state  - JSON for each module (market, choices, missions, safety, progress, child)")
    pdf.p("Allowed module keys (do not invent extra wallets or extra databases):")
    pdf.code("child, market, choices, missions, safety, progress")
    pdf.p("To create a first document: start the frontend (npm run dev), open http://localhost:5173/login, enter a name, click Login. Then click the refresh icon in Compass on wisecub > children.")

    pdf.heading("7. How your module should save (shared rule)")
    pdf.p("Use the existing API. Do not create a second Mongo connection or a second cash wallet.")
    pdf.code(
        "PUT /api/children/{child_id}\n"
        "GET /api/children/{child_id}\n"
        "PUT /api/state/{child_id}/{module}\n"
        "GET /api/state/{child_id}/{module}"
    )
    pdf.p("Example market body:")
    pdf.code('{"data": {"cash": 100000, "holdings": {}}}')
    pdf.p("If Mongo is down, the demo still works in the browser with localStorage. That is expected.")

    pdf.heading("8. One shared cloud database (optional)")
    pdf.p(
        "Only do this if the team agrees we need ONE database everyone writes to. "
        "Do not expose your laptop Mongo to the internet (no password, not safe)."
    )
    pdf.bullet("Create a free cluster at https://www.mongodb.com/cloud/atlas")
    pdf.bullet("Create a database user (username + password).")
    pdf.bullet("Network Access: add each teammate's IP address.")
    pdf.bullet("Atlas > Connect > Drivers. Copy the URI, set the database name to wisecub:")
    pdf.code("mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/wisecub")
    pdf.bullet("Each person puts that URI in their own .env as MONGODB_URI. Send the password privately, not in the GitHub repo.")
    pdf.bullet("In Compass, paste that Atlas URI instead of localhost.")

    pdf.heading("9. Quick checklist")
    pdf.bullet("Compass connects with mongodb://localhost:27017")
    pdf.bullet(".env has MONGODB_URI and MONGODB_DB=wisecub")
    pdf.bullet("http://localhost:8000/health shows database connected")
    pdf.bullet("http://localhost:5173/login then refresh Compass > wisecub > children")
    pdf.bullet("Work on YOUR feature branch. Save module JSON under your module name only.")

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        0,
        5,
        "Questions about shared files (App.tsx, routes, Cub, Mongo helpers): message Member 1 (stock market) before changing them.",
    )

    pdf.output(str(OUT))
    print(OUT)


if __name__ == "__main__":
    build()
