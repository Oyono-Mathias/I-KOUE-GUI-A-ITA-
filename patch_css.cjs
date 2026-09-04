const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const css = `
        /* PAGE CONTACT SPECIFIC */
        #page-contact .coord-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin: 24px 0;
        }
        #page-contact .coord-card {
            background: var(--blanc-pur);
            border-radius: 16px;
            padding: 24px;
            box-shadow: var(--shadow);
            border-left: 5px solid var(--or-solaire);
            display: flex;
            align-items: flex-start;
            gap: 16px;
            transition: transform 0.2s;
        }
        #page-contact .coord-card:active { transform: scale(0.98); }
        #page-contact .coord-card .icon {
            width: 56px;
            height: 56px;
            min-width: 56px;
            border-radius: 50%;
            background: var(--fond-alterne);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        #page-contact .coord-card .icon.blue { background: #E3F2FD; }
        #page-contact .coord-card .icon.green { background: #E8F5E9; }
        #page-contact .coord-card .icon.orange { background: #FFF3E0; }
        #page-contact .coord-card .icon.red { background: #FFEBEE; }
        #page-contact .coord-card h3 {
            font-size: 16px;
            color: var(--bleu-rca);
            margin-bottom: 6px;
        }
        #page-contact .coord-card p {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            margin: 0;
        }
        #page-contact .coord-card a {
            color: var(--bleu-rca);
            text-decoration: none;
            font-weight: 600;
        }
        #page-contact .coord-card a:hover {
            color: var(--or-solaire);
        }

        #page-contact .horaires-box {
            background: linear-gradient(135deg, var(--bleu-rca) 0%, var(--bleu-ciel) 100%);
            border-radius: 16px;
            padding: 28px 24px;
            color: var(--blanc-pur);
            margin: 24px 0;
            position: relative;
            overflow: hidden;
        }
        #page-contact .horaires-box::before {
            content: '🕒';
            position: absolute;
            top: -20px;
            right: -20px;
            font-size: 140px;
            opacity: 0.1;
        }
        #page-contact .horaires-box h3 {
            font-size: 20px;
            color: var(--or-solaire);
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
        }
        #page-contact .horaires-list {
            list-style: none;
            padding: 0;
            position: relative;
            z-index: 1;
        }
        #page-contact .horaires-list li {
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 15px;
        }
        #page-contact .horaires-list li:last-child {
            border-bottom: none;
        }
        #page-contact .horaires-list li .day {
            font-weight: 600;
        }
        #page-contact .horaires-list li .time {
            color: var(--or-solaire);
            font-weight: 700;
        }
        #page-contact .horaires-list li.closed .time {
            color: #FF6B6B;
        }

        #page-contact .form-container {
            background: var(--blanc-pur);
            border-radius: 16px;
            padding: 28px 24px;
            box-shadow: var(--shadow-lg);
            margin: 24px 0;
            border-top: 5px solid var(--or-solaire);
        }
        #page-contact .form-container h3 {
            font-size: 20px;
            color: var(--bleu-rca);
            margin-bottom: 8px;
        }
        #page-contact .form-container > p {
            font-size: 14px;
            color: #666;
            margin-bottom: 24px;
        }

        #page-contact .faq-list {
            margin: 24px 0;
        }
        #page-contact .faq-item {
            background: var(--blanc-pur);
            border-radius: 12px;
            margin-bottom: 12px;
            box-shadow: var(--shadow);
            overflow: hidden;
            border-left: 4px solid var(--or-solaire);
        }
        #page-contact .faq-question {
            padding: 18px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            color: var(--bleu-rca);
            font-size: 15px;
            min-height: 48px;
        }
        #page-contact .faq-question .arrow {
            transition: transform 0.3s;
            font-size: 18px;
            color: var(--or-solaire);
        }
        #page-contact .faq-item.active .faq-question .arrow {
            transform: rotate(180deg);
        }
        #page-contact .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 20px;
        }
        #page-contact .faq-item.active .faq-answer {
            max-height: 300px;
            padding: 0 20px 18px;
        }
        #page-contact .faq-answer p {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            margin: 0;
        }
        #page-contact .faq-answer a {
            color: var(--bleu-rca);
            font-weight: 600;
            text-decoration: none;
        }

        #page-contact .whatsapp-direct {
            background: #25D366;
            border-radius: 16px;
            padding: 28px 24px;
            color: var(--blanc-pur);
            margin: 24px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        #page-contact .whatsapp-direct::before {
            content: '💬';
            position: absolute;
            top: -20px;
            right: -20px;
            font-size: 140px;
            opacity: 0.15;
        }
        #page-contact .whatsapp-direct h3 {
            font-size: 20px;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        #page-contact .whatsapp-direct p {
            font-size: 14px;
            margin-bottom: 16px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }
        #page-contact .whatsapp-direct .btn-whatsapp {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--blanc-pur);
            color: #25D366;
            padding: 14px 28px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            min-height: 48px;
            position: relative;
            z-index: 1;
            transition: transform 0.2s;
        }
        #page-contact .whatsapp-direct .btn-whatsapp:active {
            transform: scale(0.97);
        }

        #page-contact .map-container {
            background: var(--fond-alterne);
            border-radius: 16px;
            padding: 40px 24px;
            text-align: center;
            margin: 24px 0;
            border: 2px dashed var(--bordure);
        }
        #page-contact .map-container .map-icon {
            font-size: 64px;
            margin-bottom: 12px;
        }
        #page-contact .map-container h4 {
            font-size: 18px;
            color: var(--bleu-rca);
            margin-bottom: 8px;
        }
        #page-contact .map-container p {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
        }
        #page-contact .map-container .btn-map {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bleu-rca);
            color: var(--blanc-pur);
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            min-height: 44px;
        }

        @media (min-width: 768px) {
            #page-contact .coord-grid { grid-template-columns: repeat(2, 1fr); }
        }
`;

html = html.replace('/* MEDIA QUERIES GLOBALES */', css + '\n        /* MEDIA QUERIES GLOBALES */');
fs.writeFileSync('index.html', html);
