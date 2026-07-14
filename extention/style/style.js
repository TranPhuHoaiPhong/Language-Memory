function injectCss() {

    if (document.getElementById("subtitle-style")) return;

    const style = document.createElement("style");

    style.id = "subtitle-style";

    style.textContent = `

        #subtitle-translate{
            position:absolute;
            left:50%;
            transform:translateX(-50%);
            width:95%;
            
            text-align:center;
            pointer-events:none;
            z-index:40;
            font-size:28px;
        }

        #subtitle-translate .sub-original,
        #subtitle-translate .sub-translated{
            font-size:inherit;
            font-weight:600;
            margin:0;
        }

        #subtitle-translate .sub-original{
            color:#fff;
        }

        #subtitle-translate .sub-translated{
            margin-top:0.5em;
            color:#fff;
        }

        #subtitle-translate .sub-line{

            display:table;

            margin-left:auto;
            margin-right:auto;

            white-space:pre-wrap;
            word-break:break-word;

            background:rgba(0,0,0,0.4);

            padding:5px 13px;
            border-radius:4px;

            line-height:1.3;

            text-shadow:
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px  1px 0 #000,
                1px  1px 0 #000;

            box-decoration-break:clone;
            -webkit-box-decoration-break:clone;
        }

        #subtitle-translate .sub-line + .sub-line{
            margin-top:0.5em;
        }

        #subtitle-translate .sub-original{
            pointer-events:auto;
            user-select:text;
            -webkit-user-select:text;
        }

        #subtitle-translate .sub-translated{
            pointer-events:none;
        }

        #subtitle-translate .sub-original::selection {
            color: #ffe600;
        }

        /* ======================= Word Popup ======================= */

        #word-popup {
            position: absolute;
            display: none;
            visibility: hidden;
            z-index: 42;
            min-width: 160px;
            // max-width: 280px;
            background: rgba(0,0,0,0.4);
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
            left: 50%;
            width: 12px;
            height: 12px;
            // background: rgba(0,0,0,0.4);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            transform: translateX(-50%) rotate(45deg);
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
            text-align: center;
        }

        .word-popup-ipa {
            color: #9ecbff;
            font-size: 13px;
            margin-bottom: 6px;
            min-height: 16px;
            text-align: center;
        }

        .word-popup-meaning {
            color: #e0e0e0;
            font-size: 13px;
            line-height: 1.4;
            margin-bottom: 8px;
            min-height: 16px;
            text-align: center;
        }

        .word-popup-loading {
            color: #888;
            font-style: italic;
            font-size: 13px;
        }

        .word-popup-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
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

        .word-popup-audio{

            border:none;
            background:none;

            cursor:pointer;

            font-size:22px;

            width:25%;

            color:white;
        }

        .container-word{

            display: flex;
            gap: 10px

        }

        .word-popup-audio{

            border:none;
            background:none;

            cursor:pointer;

            font-size:22px;

            width:25%;

            color:white;

            transition: color 0.1s ease, transform 0.1s ease;
        }

        .word-popup-audio:hover:not(:disabled){
            color:#9ecbff;
            transform: scale(1.1);
        }

        .word-popup-audio:active:not(:disabled){
            transform: scale(0.9);
        }

        .word-popup-audio:disabled{
            color:#666;
            cursor:default;
        }

        .word-popup-audio.playing{
            color:#9ecbff;
            animation: word-popup-audio-pulse 0.7s ease-in-out infinite;
        }

        @keyframes word-popup-audio-pulse{
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.25); }
        }

    `;

    document.head.appendChild(style);

}