const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const Message = require("../models/Message");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function renderEmailTemplate(message) {
  const clean = DOMPurify.sanitize(message);
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:20px;">
  <tr>
    <td>
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; margin:auto; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:20px; text-align:center; border-bottom:1px solid #eee;">
            <img src="https://res.cloudinary.com/dbqwyf8tw/image/upload/v1775912332/1775912255161_zjvylh.jpg" width="120" style="display:block; margin:0 auto;"/>
          </td>
        </tr>
        <tr>
          <td style="padding:20px; font-size:15px; color:#333;">
            ${clean}
          </td>
        </tr>
        <tr>
          <td style="padding:20px;">
            <p>Warm regards,</p>
            <p><b>Team Easymakan</b></p>
            <p>📞 +91 8731807899 | +91 8777654651</p>
            <p>📧 easymakandev@gmail.com</p>
            <p>🌐 www.easymakandev.com</p>
            <p>🏢 Unit 320, PS Abacus, Action Area IIE, Newtown, Kolkata - 700161</p>
            <a href="https://www.easymakandev.com"
               style="display:inline-block; padding:10px 20px; background:#FFC107; border-radius:20px; text-decoration:none; color:#000;">
               Visit our Website
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

const getChatMessages = async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();

    const messages = await Message.find({
      $expr: {
        $eq: [{ $toLower: { $trim: { input: "$email" } } }, email],
      },
    })
      .sort({ timestamp: 1 })
      .select("sender message timestamp -_id");

    const rendered = messages.map((m) => {
      if (m.sender === "ai") {
        return {
          type: "email",
          html: renderEmailTemplate(m.message),
          timestamp: m.timestamp,
        };
      }
      return {
        type: "text",
        text: m.message,
        timestamp: m.timestamp,
      };
    });

    console.log(`[GET /api/chat/${email}] ${rendered.length} messages`);
    return res.json(rendered);
  } catch (err) {
    console.error("[GET /api/chat] ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getChatMessages };
