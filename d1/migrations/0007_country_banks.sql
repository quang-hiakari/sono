-- Migration 0007: Add country to profiles, create banks reference table

ALTER TABLE profiles ADD COLUMN country TEXT NOT NULL DEFAULT 'VN';

CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  bin TEXT,
  swift TEXT
);

-- VN banks seed
INSERT INTO banks (id, country, name, short_name, bin) VALUES
  ('VCB',       'VN', 'Ngân hàng TMCP Ngoại thương Việt Nam',             'Vietcombank',      '970436'),
  ('TCB',       'VN', 'Ngân hàng TMCP Kỹ thương Việt Nam',                'Techcombank',      '970407'),
  ('MB',        'VN', 'Ngân hàng TMCP Quân đội',                          'MBBank',           '970422'),
  ('VTB',       'VN', 'Ngân hàng TMCP Công thương Việt Nam',              'VietinBank',       '970415'),
  ('BIDV',      'VN', 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',     'BIDV',             '970418'),
  ('ACB',       'VN', 'Ngân hàng TMCP Á Châu',                            'ACB',              '970416'),
  ('VPB',       'VN', 'Ngân hàng TMCP Việt Nam Thịnh Vượng',              'VPBank',           '970432'),
  ('AGRI',      'VN', 'Ngân hàng Nông nghiệp và Phát triển Nông thôn',    'Agribank',         '970405'),
  ('HDB',       'VN', 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', 'HDBank',           '970437'),
  ('STB',       'VN', 'Ngân hàng TMCP Sài Gòn Thương Tín',                'Sacombank',        '970403'),
  ('TPB',       'VN', 'Ngân hàng TMCP Tiên Phong',                        'TPBank',           '970423'),
  ('MSB',       'VN', 'Ngân hàng TMCP Hàng Hải Việt Nam',                 'MSB',              '970426'),
  ('SHB',       'VN', 'Ngân hàng TMCP Sài Gòn - Hà Nội',                 'SHB',              '970443'),
  ('OCB',       'VN', 'Ngân hàng TMCP Phương Đông',                       'OCB',              '970448'),
  ('VIB',       'VN', 'Ngân hàng TMCP Quốc tế Việt Nam',                  'VIB',              '970441'),
  ('EIB',       'VN', 'Ngân hàng TMCP Xuất nhập khẩu Việt Nam',           'Eximbank',         '970431'),
  ('LPB',       'VN', 'Ngân hàng TMCP Bưu điện Liên Việt',                'LienVietPostBank', '970449'),
  ('SEAB',      'VN', 'Ngân hàng TMCP Đông Nam Á',                        'SeABank',          '970440'),
  ('BVB',       'VN', 'Ngân hàng TMCP Bảo Việt',                          'BaoVietBank',      '970438'),
  ('NASB',      'VN', 'Ngân hàng TMCP Bắc Á',                             'BacABank',         '970409'),
  ('PGB',       'VN', 'Ngân hàng TMCP Xăng dầu Petrolimex',               'PGBank',           '970430'),
  ('VAB',       'VN', 'Ngân hàng TMCP Việt Á',                            'VietABank',        '970427'),
  ('NCB',       'VN', 'Ngân hàng TMCP Quốc dân',                          'NCB',              '970419'),
  ('CAKE',      'VN', 'CAKE by VPBank',                                    'CAKE',             '546034'),
  ('UBANK',     'VN', 'Ubank by VPBank',                                   'Ubank',            '546035'),
  ('TIMO',      'VN', 'Timo by Ban Viet Bank',                             'Timo',             '963388'),
  ('MOMO',      'VN', 'Ví MoMo',                                           'MoMo',             '422589'),
  ('ZALOPAY',   'VN', 'ZaloPay',                                           'ZaloPay',          '987654'),
  ('VNPAY',     'VN', 'VNPay',                                             'VNPay',            '971011'),
  ('SHOPEEPAY', 'VN', 'ShopeePay',                                         'ShopeePay',        NULL);

-- JP banks seed
INSERT INTO banks (id, country, name, short_name, swift) VALUES
  ('MUFG',      'JP', '三菱UFJ銀行 (MUFG Bank)',                    'MUFG Bank',           'BOTKJPJT'),
  ('SMBC',      'JP', '三井住友銀行 (SMBC)',                         'SMBC',                'SMBCJPJT'),
  ('MIZUHO',    'JP', 'みずほ銀行 (Mizuho Bank)',                    'Mizuho Bank',         'MHBKJPJT'),
  ('RESONA',    'JP', 'りそな銀行 (Resona Bank)',                    'Resona Bank',         'DIWAJPJT'),
  ('SAITAMA',   'JP', '埼玉りそな銀行 (Saitama Resona Bank)',        'Saitama Resona Bank', 'DIWAJPJT'),
  ('JPPOST',    'JP', 'ゆうちょ銀行 (Japan Post Bank)',              'Japan Post Bank',     'JPPYJPJT'),
  ('RAKUTEN',   'JP', '楽天銀行 (Rakuten Bank)',                     'Rakuten Bank',        'RAKTJPJX'),
  ('SBI',       'JP', 'SBI新生銀行 (SBI Shinsei Bank)',              'SBI Shinsei Bank',    'LTSBJPJT'),
  ('SONY',      'JP', 'ソニー銀行 (Sony Bank)',                       'Sony Bank',           'SNBKJPJT'),
  ('PAYPAY',    'JP', 'PayPay銀行 (PayPay Bank)',                    'PayPay Bank',         'PJPYJPJT'),
  ('AEON',      'JP', 'イオン銀行 (AEON Bank)',                       'AEON Bank',           'AEBJPJT'),
  ('SEVENBANK', 'JP', 'セブン銀行 (Seven Bank)',                      'Seven Bank',          'SVNJPJT'),
  ('LAWSON',    'JP', 'ローソン銀行 (Lawson Bank)',                   'Lawson Bank',         NULL),
  ('KYOTO',     'JP', '京都銀行 (Bank of Kyoto)',                    'Bank of Kyoto',       'KYOTJPJT'),
  ('FUKUOKA',   'JP', '福岡銀行 (Bank of Fukuoka)',                  'Bank of Fukuoka',     'FUKOJPJT'),
  ('SHIZUOKA',  'JP', '静岡銀行 (Shizuoka Bank)',                    'Shizuoka Bank',       'SZDKJPJT'),
  ('CHIBA',     'JP', '千葉銀行 (Chiba Bank)',                       'Chiba Bank',          'CBBKJPJT'),
  ('YOKOHAMA',  'JP', '横浜銀行 (Bank of Yokohama)',                 'Bank of Yokohama',    'HAMAJPJT'),
  ('HIROSHIMA', 'JP', '広島銀行 (Hiroshima Bank)',                   'Hiroshima Bank',      'HIROJPJT'),
  ('NISHI_NIP', 'JP', '西日本シティ銀行 (Nishi-Nippon City Bank)',   'Nishi-Nippon City Bank', 'NNCTJPJT');
