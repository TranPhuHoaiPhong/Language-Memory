function injectPopup() {

    if (document.getElementById("subtitle-style")) return;

    const style = document.createElement("style");

    style.id = "subtitle-style";

    style.textContent = `

        #word-popup {
            position: fixed;
            display: none;
            z-index: 999999;
            min-width: 160px;
            max-width: 280px;
            background: #1e1e1e;
            color: #fff;
            border-radius: 10px;
            padding: 10px 12px;
            font-family: "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.08);
            animation: word-popup-fade 0.12s ease-out;
            pointer-events: auto;
        }

        #word-popup::after {
            content: "";
            position: absolute;
            bottom: -6px;
            left: 16px;
            width: 12px;
            height: 12px;
            background: #1e1e1e;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            transform: rotate(45deg);
        }

        @keyframes word-popup-fade {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .word-popup-word {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 2px;
            word-break: break-word;
        }

        .word-popup-ipa {
            color: #9ecbff;
            font-size: 13px;
            margin-bottom: 6px;
            min-height: 16px;
        }

        .word-popup-meaning {
            color: #e0e0e0;
            font-size: 13px;
            line-height: 1.4;
            margin-bottom: 8px;
            min-height: 16px;
        }

        .word-popup-loading {
            color: #888;
            font-style: italic;
            font-size: 13px;
        }

        .word-popup-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #3b82f6;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 5px 10px;
            font-size: 12.5px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .word-popup-btn:hover {
            background: #2563eb;
        }

        .word-popup-btn:disabled {
            background: #555;
            cursor: default;
        }

        .word-popup.loading {
            min-width: 120px;
            text-align: center;
        }


        .word-popup.loading .container-word {
            display: none;
        }





        // modal login
        

    `;

    document.head.appendChild(style);

}