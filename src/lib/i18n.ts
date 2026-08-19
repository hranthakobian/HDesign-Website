"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchSettingsFromSupabase, saveSettingsToSupabase } from './settingsSync';

const hyIniContent = `[common]
app_title = HDesign
qr_creator_nav = QR Ստեղծող
pattern_generator_nav = Նախշերի Ստեղծող
dashboard_nav = Վահանակ

[qr_creator]
controls_title = Կառավարում
saved_styles_title = Պահպանված QR ոճեր
style_name_placeholder = Ոճի անուն
save_btn = Պահպանել
rename_tooltip = Վերանվանել
delete_tooltip = Ջնջել
text_input_label = QR կոդի տեքստ / հղում
header_input_label = Վերնագրի տեքստ (վերևում)
footer_input_label = Ներքևի տեքստ
left_label_input = Ձախ կողմնային պիտակ
right_label_input = Աջ կողմնային պիտակ
line_thickness_label = Գծի հաստություն
corner_thickness_label = Անկյան հաստություն
module_style_label = Մոդուլի ոճ
module_vertical = Ուղղահայաց
module_horizontal = Հորիզոնական
module_dots = Կետեր
bg_pattern_label = Ֆոնային նախշ
bg_none = Առանց նախշի
bg_default_group = Լռելյայն նախշեր
bg_custom_group = Սեփական նախշեր (Supabase)
corner_style_label = Անկյան ոճ
corner_rounded = Կլորացված
corner_sharp = Սուր
corner_ring = Օղակաձև
qr_bg_color_label = QR-ի ֆոնի գույն
qr_fg_color_label = QR-ի գծերի գույն
poster_bg_color_label = Պաստառի ֆոնի գույն
poster_text_color_label = Պաստառի տեքստի գույն
center_logo_label = Կենտրոնական լոգո
logo_file_label = Լոգոյի նիշք
footer_note = խմբագրեք տեքստը, լոգոն, գծի հաստությունը և անկյան ձևը ներքևում

[pattern_generator]
canvas_width_label = Կտավի լայնություն
canvas_height_label = Կտավի բարձրություն
export_svg_btn = Արտահանել SVG
export_png_btn = Արտահանել PNG
export_jpg_btn = Արտահանել JPG
layers_title = Շերտեր
add_layer_btn = Ավելացնել շերտ
no_presets_msg = Պահպանված պրեսեթներ չկան: Ստեղծեք որևէ ոճ և պահպանեք այն վերևում:
edit_layer_title = Խմբագրել շերտը:
lines_count_label = Գծերի քանակ
angle_label = Անկյուն
gap_label = Հեռավորություն (Gap)
thickness_label = Հաստություն
rounded_ends_label = Կլորացված ծայրեր
dashed_lines_label = Գծիկավոր գծեր
dash_length_1_label = Գծիկի երկարություն 1
dash_gap_1_label = Գծիկի բացատ 1
dash_length_2_label = Գծիկի երկարություն 2
dash_gap_2_label = Գծիկի բացատ 2
dash_offset_label = Գծիկի շեղում
layer_color_label = Շերտի գույն
layer_x_offset_label = Շերտի շեղում X
layer_y_offset_label = Շերտի շեղում Y
tip_edit_line = Հուշում. Բացեք շերտը և սեղմեք գծի վրա, կամ սեղմեք կտավի վրա գիծն առանձին խմբագրելու համար:
edit_line_title = Խմբագրել գիծը
close_btn = Փակել
link_to_layer_label = Կապել շերտի կարգավորումներին
custom_line_label = Սեփական գիծ
linked_line_label = Կապված է

[randomizer]
random_presets_section = Պատահական նախշերի գեներատոր
preset_name_placeholder = Պրեսեթի անուն
save_preset_btn = Պահպանել պրեսեթը
generate_random_btn = Ստեղծել պատահական
random_filters_btn = Պատահականության զտիչներ
include_styles_label = Ներառել ոճերը
solid_lines_checkbox = Հոծ գծեր
dashed_lines_checkbox = Գծիկավոր գծեր
rounded_ends_checkbox = Կլորացված ծայրեր
min_layers_label = Մին. շերտեր
max_layers_label = Մաքս. շերտեր
min_thickness_label = Մին. հաստություն
max_thickness_label = Մաքս. հաստություն
min_gap_label = Մին. հեռավորություն
max_gap_label = Մաքս. հեռավորություն
angle_constraints_mode = Անկյան սահմանափակում
angle_mode_discrete = Ընտրովի անկյուններ
angle_mode_range = Անկյան միջակայք
min_angle_label = Մին. անկյուն
max_angle_label = Մաքս. անկյուն
color_palette_label = Գունային գամմա
palette_all = Բոլորը
palette_brand = Բրենդային
palette_colorful = Գունավոր
palette_monochrome = Մոնոքրոմ (սև/սպիտակ)
palette_warm = Տաք գույներ
palette_cool = Սառը գույներ

[context_menu]
rename = Վերանվանել
duplicate = Կրկնօրինակել
bring_to_front = Բերել դիմաց (Front)
send_to_back = Տանել հետև (Back)
delete = Ջնջել

[dashboard]
title_global = Վերլուծությունների վահանակ
title_detail = QR կոդի տվյալներ
subtitle_global = Հետևեք ձեր QR կոդի ցուցանիշներին և լսարանի տվյալներին:
subtitle_detail = Դիտում եք վիճակագրությունը հղման համար՝ 
back_btn = Հետ դեպի բոլորը
total_scans = Ընդհանուր սկանավորումներ
unique_visitors = Օգտատերերի քանակ (Unique)
active_links = Ակտիվ հղումներ
active_links_title = Ակտիվ հղումներ
table_id = ID
table_target = Նպատակային հղում
table_created = Ստեղծվել է
table_scans = Սկանավորումներ
table_actions = Գործողություններ
action_copy = Պատճենել
action_edit = Խմբագրել
action_details = Մանրամասներ
action_delete = Ջնջել
no_links = Ստեղծված հղումներ դեռ չկան:
traffic_title = Տրաֆիկը ժամանակի ընթացքում
browsers_title = Բրաուզերներ
os_title = Օպերացիոն համակարգեր
recent_scans_title = Վերջին սկանավորումները
table_time = Ժամանակ
table_device = Սարք / ՕՀ
table_browser = Բրաուզեր
table_ip = IP
no_scans = Գրանցված սկանավորումներ դեռ չկան:
loading = Վերլուծությունը բեռնվում է...
confirm_delete = Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս QR կոդը և իր բոլոր վիճակագրությունները:
prompt_edit = Ներմուծեք նոր նպատակային հղումը:
success_update = Հղումը հաջողությամբ թարմացվեց:

[contact]
form_title = Հետադարձ Կապ
name_placeholder = Ձեր անունը...
email_placeholder = Էլ. հասցե...
message_placeholder = Ձեր հաղորդագրությունը...
submit_btn = Ուղարկել
submitting_btn = Ուղարկվում է...
success_msg = Շնորհակալություն! Ձեր հաղորդագրությունը հաջողությամբ ուղարկվեց:
error_fields = Խնդրում ենք լրացնել բոլոր դաշտերը:
error_conn = Կապի սխալ. Խնդրում ենք փորձել կրկին:
desc = Ստեղծարար և Գործնական դիզայն լուծումներ: Յուրաքանչյուր ինտերֆեյս ստեղծված է սիրով և մաթեմատիկական ճշգրտությամբ:
subscribe_title = Բաժանորդագրվել
subscribe_desc = Բաժանորդագրվեք մեր էլ. նամակներին՝ նորությունները և թարմացումները բաց չթողնելու համար։
subscribe_btn = Բաժանորդագրվել
subscribe_success = Շնորհակալություն բաժանորդագրվելու համար:
subscribe_error = Խնդրում ենք լրացնել էլ. հասցեն:
subscribe_already_exists = Այս էլ. հասցեն արդեն բաժանորդագրված է:
links_title = Հղումներ
contacts_title = Կոնտակտներ
email_label = Էլ. հասցե՝
phone_label = Հեռախոս՝
address_label = Երևան, Հայաստան
copyright = Հակոբյան Դիզայն. Բոլոր իրավունքները պաշտպանված են։
designed_by = Ձեւավորումը եւ Գաղափարը՝ Հրանտ Հակոբյանի Պատրաստված է՝ Antigravity-ով
nav_home = Տուն
nav_about = Մասին
nav_works = Աշխատանքներ
nav_docs = Փաստաթղթեր
fonts_nav = Տառատեսակներ

[fonts]
title = HDesign Տառատեսակներ
subtitle = Մասնագիտացված հայերեն և անգլերեն տառատեսակներ ձեր դիզայն նախագծերի համար
search_placeholder = Որոնել տառատեսակներ...
advanced_search = Ընդլայնված որոնում
filters_title = Զտիչներ
category_label = Կատեգորիա
license_label = Լիցենզիա
creator_label = Հեղինակ
price_free = Անվճար
price_paid = Վճարովի
downloadable = Ներբեռնելի
all = Բոլորը
preview_text_placeholder = Գրեք տեքստ փորձարկման համար...
try_font = Փորձարկել
download = Ներբեռնել
purchase = Գնել
size = Չափս
letter_spacing = Տառատարածություն
line_height = Տողի բարձրություն
alignment = Հավասարեցում
color = Գույն
bg_color = Ֆոնի գույն
waterfall = Ջրվեժ (Waterfall)
character_map = Նիշերի քարտեզ
css_use = Օգտագործումը CSS-ում
no_fonts = Տառատեսակներ չեն գտնվել:
pangrams = Պանգրամներ
numbers_symbols = Թվեր և նշաններ
case_label = Տեքստի ռեգիստր
case_normal = Լռելյայն
case_upper = ՄԵԾԱՏԱՌ
reset = Վերականգնել
view_only = Ոչ ներբեռնելի
loading_fonts = Տառատեսակները բեռնվում են...
preview_text_default = Հրանտ Հակոբյան Դիզայն 2026
loading_details = Տվյալները բեռնվում են...
font_not_found = Տառատեսակը չի գտնվել
back_to_list = Հետ դեպի ցուցակ
back_to_fonts = Հետ դեպի տառատեսակներ
click_character = Կտտացրեք նիշի վրա՝ այն տեքստային դաշտում ավելացնելու համար
variability_axes = Փոփոխականություն և Ոճեր (Variability & OpenType)
weight = Հաստություն (Weight)
slant = Թեքություն (Slant)
width = Լայնություն (Width)
italic = Շղագիր (Italic Axis)
ligatures = Կապագիր (Ligatures)
kerning = Միջտառային տարածություն (Kerning)
small_caps = Փոքրատառ գլխատառեր (Small Caps)
oldstyle_figures = Հին ոճի թվեր (Oldstyle Figures)
specimen_showcase = Տառատեսակի Շնորհանդես (Font Specimen Showcase)
weights_showcase = Հաստության ցուցադրում
glyphs_showcase = Գլիֆների ցուցադրում
sandbox_default_text = Հրանտ Հակոբյան Դիզայն Ստուդիա: Այստեղ կարող եք գրել ցանկացած տեքստ տառատեսակը փորձարկելու համար:

[nav]
home = Տուն
about = Մասին
works = Աշխատանքներ
works_branding = Բրենդինգներ
works_design = Պատկերասրահ
fonts = Տառատեսակներ
general = Ընդհանուր
docs = Փաստաթղթեր
samples = Փորձանմուշներ
contact = Կապ
more = Ավելին
menu = Ցանկ
settings = Կարգավորումներ
language = Լեզու
theme = Թեմա
theme_light = Բաց
theme_dark = Մութ
theme_green = Կանաչ
theme_custom = Գույն

[about]
title = Մասին
bio_p1 = Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։
bio_p2 = Իմ նախագծերում ես համատեղում եմ ճարտարապետական կառուցվածքայնությունն ու գրաֆիկական դիզայնի ճկունությունը: Յուրաքանչյուր տառատեսակ և տարբերանշան ինձ համար կառույց է, որն ունի իր սեփական հիմքերը, համամասնությունն ու գեղագիտական արժեքը:
contact_btn = Կապնվել
works_btn = Աշխատանքներ
specs_title = Մասնագիտացումներ
spec1_title = Տառատեսակների ստեղծում
spec1_desc = Յուրահատուկ հայկական և լատինական տառատեսակների ձևավորում, որոնք համատեղում են պատմական ակունքները և ժամանակակից երկրաչափական միտումները:
spec2_title = Բրենդավորում
spec2_desc = Տեսողական ինքնության մշակում՝ տարբերանշաններ, կորպորատիվ գույներ, տառատեսակային համակարգեր և փաթեթավորում, որոնք առանձնացնում են բրենդը շուկայում:
spec3_title = Ինտերֆեյսների դիզայն
spec3_desc = Օգտագործողի փորձի (UX) և միջավայրերի (UI) նախագծում՝ հիմնված մոդուլային դիզայն-համակարգերի և ճշգրիտ կառուցվածքների վրա:

[contact_page]
title = Կապ
subtitle = Ունե՞ք հարցեր կամ առաջարկներ: Գրեք ինձ և ես կպատասխանեմ հնարավորինս սեղմ ժամկետներում:
name_label = Անուն *
name_placeholder = Ձեր անունը
email_label = Էլ. հասցե *
email_placeholder = Ձեր էլ. հասցեն
subject_label = Թեմա
subject_placeholder = Նամակի թեման
message_label = Հաղորդագրություն *
message_placeholder = Գրեք ձեր հաղորդագրությունը այստեղ...
submit_btn = Ուղարկել
submitting_btn = Ուղարկվում է...
success_title = Հաղորդագրությունը հաջողությամբ ուղարկվել է:
success_desc = Շնորհակալություն կապնվելու համար: Ես կպատասխանեմ ձեզ շուտով:
new_msg_btn = Գրել նոր նամակ
error_fields = Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը:
error_send = Տեղի ունեցավ սխալ: Խնդրում ենք փորձել մի փոքր ուշ:
error_network = Ցանցային սխալ: Խնդրում ենք ստուգել կապը և փորձել կրկին:
details_title = Կապորդներ
details_desc = Ազատ զգացեք կապվելու ցանկացած հարցով կամ համագործակցության առաջարկներով:
email_label_small = Էլ. հասցե
phone_label_small = Հեռախոս
address_label_small = Հասցե

[works_page]
title = Աշխատանքներ
subtitle =
loading = Բեռնվում է...
view_gallery = Դիտել պատկերասրահը
cat_branding = Բրենդավորում
gallery_preview = Պատկերասրահ
pause = Դադար
autoplay = Ավտոմատ

[home]
hero_line1 = ՍՏԵՂԾԱ
hero_line2 = ԵՒ ԳՈՐԾՆԱԿԱՆ
hero_quote = Ամեն ոք չի կարող մեծ վարպետ դառնալ, բայց մեծ վարպետը կարող է գալ ամենուրից
about_title = Մասին
about_p1 = Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։
about_p2 = 
contact_btn = Կապնվել
more_about_btn = Ավելին
other_works = Այլ աշխատանքներ
more_btn = Ավելի
design_system = Դիզայնի Համակարգը
components_title = Բաղադրիչներ
components_label = ԿՈՄՊՈՆԵՆՏՆԵՐ
disabled_label = Պասիվ
checked_label = Ընտրված (Checked)
active_label = Միացված (Active)
content_height = Պարունակության բարձրություն:
icons_title = Պատկերներ
search_icon = Որոնել պատկերակ...
thickness = Հաստություն (Thickness)
sizes_showcase = Չափսերի Տարբերակներ (16px - 64px)
download_svg = Ներբեռնել SVG
download_png = Ներբեռնել PNG
copied = Պատճենված է
copy = Պատճենել
click_details = Սեղմեք մանրամասների համար
click_usage = Սեղմեք՝ տեսնելու օգտագործման ձևը
details_label = Մանրամասներ
value_label = Արժեք
active_tab = Ակտիվ տաբ
color_hex = Գույնը (Hex)
font_title = Տառատեսակ
font_glyphs = HDesign Տառատեսակի Գլիֆներ
char_copied = «{char}» նիշը պատճենվեց:
click_copy_char = Կտտացրեք նիշի վրա՝ այն պատճենելու համար
font_weight_label = Հաստություն (Font Weight)
[works_detail]
branding_case = Բրենդավորման Քեյս
category = Կարգ
client = Հաճախորդ
year = Տարեթիվ
color_palette = Բրենդի Գունապնակ
typography = Տառատեսակներ
preview_text = Հրանտ Հակոբյան Դիզայն Ստուդիա 2026
press_focus = Սեղմեք տիլդան՝ մեդիան կենտրոնացնելու համար
other_works = ← Դեպի Այլ Աշխատանքներ
not_found = Աշխատանքը չի գտնվել
back = Վերադառնալ
loading = Բեռնվում են տվյալները...
loading_images = Բեռնվում են պատկերները
no_details = Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:
`;

const enIniContent = `[common]
app_title = HDesign
qr_creator_nav = QR Creator
pattern_generator_nav = Pattern Generator
dashboard_nav = Dashboard

[qr_creator]
controls_title = Controls
saved_styles_title = Saved QR Styles
style_name_placeholder = Style Name
save_btn = Save
rename_tooltip = Rename
delete_tooltip = Delete
text_input_label = QR Content / Link
header_input_label = Top Title Text
footer_input_label = Bottom Line Text
left_label_input = Left Side Label
right_label_input = Right Side Label
line_thickness_label = Vertical Line Thickness
corner_thickness_label = Corner Thickness
module_style_label = Module Style
module_vertical = Vertical
module_horizontal = Horizontal
module_dots = Dots
bg_pattern_label = Background Pattern
bg_none = None
bg_default_group = Default Presets
bg_custom_group = Custom Presets (Supabase)
corner_style_label = Corner Style
corner_rounded = Rounded
corner_sharp = Sharp
corner_ring = Ring
qr_bg_color_label = QR Background Color
qr_fg_color_label = QR Foreground Color
poster_bg_color_label = Poster Background Color
poster_text_color_label = Poster Text Color
center_logo_label = Center Logo
logo_file_label = Logo File
footer_note = edit the text, logo, line thickness, and corner shape below

[pattern_generator]
canvas_width_label = Canvas Width
canvas_height_label = Canvas Height
export_svg_btn = Export SVG
export_png_btn = Export PNG
export_jpg_btn = Export JPG
layers_title = Layers
add_layer_btn = Add Layer
no_presets_msg = No presets saved yet. Set up a style and save it above!
edit_layer_title = Edit Layer:
lines_count_label = Lines Count
angle_label = Angle
gap_label = Gap
thickness_label = Thickness
rounded_ends_label = Rounded Ends
dashed_lines_label = Dashed Lines
dash_length_1_label = Dash Length 1
dash_gap_1_label = Dash Gap 1
dash_length_2_label = Dash Length 2
dash_gap_2_label = Dash Gap 2
dash_offset_label = Dash Offset
layer_color_label = Layer Color
layer_x_offset_label = Layer Offset X
layer_y_offset_label = Layer Offset Y
tip_edit_line = Tip: Expand the layer and click a line, or click it in the canvas to edit it individually!
edit_line_title = Edit Line
close_btn = Close
link_to_layer_label = Link to Layer Settings
custom_line_label = Custom Line
linked_line_label = Linked
center_line_label = Center

[randomizer]
random_presets_section = Random Pattern Generator
preset_name_placeholder = Preset Name
save_preset_btn = Save Preset
generate_random_btn = Generate Random
random_filters_btn = Random Filters
include_styles_label = Include Styles
solid_lines_checkbox = Solid Lines
dashed_lines_checkbox = Dashed Lines
rounded_ends_checkbox = Rounded Ends
min_layers_label = Min Layers
max_layers_label = Max Layers
min_thickness_label = Min Thickness
max_thickness_label = Max Thickness
min_gap_label = Min Gap
max_gap_label = Max Gap
angle_constraints_mode = Angle Constraints
angle_mode_discrete = Allowed Angles
angle_mode_range = Angle Range
min_angle_label = Min Angle
max_angle_label = Max Angle
color_palette_label = Color Palette
palette_all = All Colors
palette_brand = Brand Colors
palette_colorful = Vibrant Colors
palette_monochrome = Monochrome
palette_warm = Warm Palette
palette_cool = Cool Palette

[context_menu]
rename = Rename
duplicate = Duplicate
bring_to_front = Bring to Front (Front)
send_to_back = Send to Back (Back)
delete = Delete

[dashboard]
title_global = Analytics Dashboard
title_detail = QR Code Details
subtitle_global = Track your QR code performance and audience insights.
subtitle_detail = Viewing statistics for target URL: 
back_btn = Back to All
total_scans = Total Scans
unique_visitors = Unique Visitors
active_links = Active Links
active_links_title = Active Links
table_id = ID
table_target = Target URL
table_created = Created At
table_scans = Scans
table_actions = Actions
action_copy = Copy
action_edit = Edit
action_details = Details
action_delete = Delete
no_links = No links generated yet.
traffic_title = Traffic Over Time
browsers_title = Browsers
os_title = Operating Systems
recent_scans_title = Recent Scans
table_time = Time
table_device = Device / OS
table_browser = Browser
table_ip = IP
no_scans = No scans recorded yet.
loading = Loading analytics...
confirm_delete = Are you sure you want to delete this QR code and all its analytics?
prompt_edit = Enter the new destination URL:
success_update = Link updated successfully!

[contact]
form_title = Contact Us
name_placeholder = Your Name...
email_placeholder = Email Address...
message_placeholder = Your Message...
submit_btn = Send Message
submitting_btn = Sending...
success_msg = Thank you! Your message has been sent successfully.
error_fields = Please fill in all fields.
error_conn = Connection error. Please try again.
desc = Creative & Practical design solutions. Every interface is created with love and mathematical precision.
subscribe_title = Subscribe
subscribe_desc = Subscribe to our newsletter to receive updates and news.
subscribe_btn = Subscribe
subscribe_success = Thank you for subscribing!
subscribe_error = Please enter your email address.
subscribe_already_exists = This email is already subscribed.
links_title = Links
contacts_title = Contacts
email_label = Email:
phone_label = Phone:
address_label = Yerevan, Armenia
copyright = Hakobyan Design. All rights reserved.
designed_by = Design & Idea by Hrant Hakobyan. Powered by Antigravity
nav_home = Home
nav_about = About
nav_works = Works
nav_docs = Docs
fonts_nav = Fonts

[fonts]
title = HDesign Fonts
subtitle = Specialized Armenian and English fonts for your design projects
search_placeholder = Search fonts...
advanced_search = Advanced Search
filters_title = Filters
category_label = Category
license_label = License
creator_label = Creator
price_free = Free
price_paid = Paid
downloadable = Downloadable
all = All
preview_text_placeholder = Type custom text to preview...
try_font = Try Font
download = Download
purchase = Purchase
size = Size
letter_spacing = Letter Spacing
line_height = Line Height
alignment = Alignment
color = Color
bg_color = Background Color
waterfall = Waterfall
character_map = Character Map
css_use = Usage in CSS
no_fonts = No fonts found.
pangrams = Pangrams
numbers_symbols = Numbers & Symbols
case_label = Text Case
case_normal = Normal
case_upper = UPPERCASE
reset = Reset
view_only = View Only
loading_fonts = Loading fonts...
preview_text_default = Hrant Hakobyan Design 2026
loading_details = Loading playground details...
font_not_found = Font Not Found
back_to_list = Back to Listing
back_to_fonts = Back to Fonts
click_character = Click on a character to insert it into your sandbox text
variability_axes = Variability & OpenType Axes
weight = Font Weight (wght)
slant = Slant Axis (slnt)
width = Width Axis (wdth)
italic = Italic Axis (ital)
ligatures = Common Ligatures
kerning = Font Kerning
small_caps = Small Caps
oldstyle_figures = Oldstyle Figures
specimen_showcase = Font Specimen Showcase
weights_showcase = Weights Comparison
glyphs_showcase = Key Glyphs Detail
sandbox_default_text = Hrant Hakobyan Design Studio: You can write any text here to test and play with this font configuration.

[nav]
home = Home
about = About
works = Works
works_branding = Branding
works_design = Gallery
fonts = Fonts
general = General
docs = Docs
samples = Samples
contact = Contact
more = More
menu = Menu
settings = Settings
language = Language
theme = Theme
theme_light = Light
theme_dark = Dark
theme_green = Green
theme_custom = Custom

[about]
title = About
bio_p1 = Hello, I'm Hrant Hakobyan, a 4th-year architecture student at the National University of Architecture and Construction of Armenia.
bio_p2 = In my projects, I combine architectural structure with graphic design flexibility. Every typeface and logo is a building for me, with its own foundations, proportion, and aesthetic value.
contact_btn = Contact
works_btn = Works
specs_title = Specializations
spec1_title = Type Design
spec1_desc = Design of unique Armenian and Latin typefaces combining historical roots and modern geometric trends.
spec2_title = Branding
spec2_desc = Visual identity development including logos, corporate colors, typographic systems, and packaging that make the brand stand out in the market.
spec3_title = UI/UX Design
spec3_desc = Designing user experience (UX) and interfaces (UI) based on modular design systems and precise structures.

[contact_page]
title = Contact
subtitle = Have questions or suggestions? Write to me and I will respond as soon as possible.
name_label = Name *
name_placeholder = Your Name
email_label = Email *
email_placeholder = Your Email
subject_label = Subject
subject_placeholder = Subject of message
message_label = Message *
message_placeholder = Write your message here...
submit_btn = Send Message
submitting_btn = Sending...
success_title = Message sent successfully!
success_desc = Thank you for contacting me. I will reply to you soon.
new_msg_btn = Write new message
error_fields = Please fill in all required fields.
error_send = An error occurred. Please try again later.
error_network = Network error. Please check your connection and try again.
details_title = Contacts
details_desc = Feel free to get in touch for any questions or collaboration proposals.
email_label_small = Email
phone_label_small = Phone
address_label_small = Address

[works_page]
title = Works
subtitle = Each project is a unique story, crafted with mathematical precision and artistic passion.
loading = Loading...
view_gallery = View Gallery
cat_branding = Branding
gallery_preview = Gallery Preview
pause = Pause
autoplay = Autoplay

[home]
hero_line1 = CREATIVE
hero_line2 = AND PRACTICAL
hero_quote = Not everyone can become a great artist, but a great artist can come from anywhere
about_title = About
about_p1 = Hello, I'm Hrant Hakobyan, a 4th-year architecture student at the National University of Architecture and Construction of Armenia.
about_p2 = 
contact_btn = Contact
more_about_btn = More
other_works = Other Works
more_btn = More
design_system = Design System
components_title = Components
components_label = COMPONENTS
disabled_label = Disabled
checked_label = Checked
active_label = Active
content_height = Content Height:
icons_title = Icons
search_icon = Search icon...
thickness = Thickness
sizes_showcase = Size Options (16px - 64px)
download_svg = Download SVG
download_png = Download PNG
copied = Copied
copy = Copy
click_details = Click for details
click_usage = Click to see usage snippet
details_label = Details
value_label = Value
active_tab = Active Tab
color_hex = Color (Hex)
font_title = Font
font_glyphs = HDesign Font Glyphs
char_copied = Character "{char}" copied.
click_copy_char = Click on a character to copy it
font_weight_label = Font Weight
[works_detail]
branding_case = Branding Case
category = Category
client = Client
year = Year
color_palette = Brand Color Palette
typography = Typography
preview_text = Hrant Hakobyan Design Studio 2026
press_focus = Press ~ to toggle focus mode
other_works = ← Other Works
not_found = Work Not Found
back = Go Back
loading = Loading case details...
loading_images = Loading images
no_details = No details available for this project.
`;

export function parseLangText(text: string | null | undefined, lang: Locale | string): string {
  if (!text) return "";
  const parts = text.split(" | ");
  if (parts.length > 1) {
    return lang === 'en' ? parts[1] : parts[0];
  }
  return text;
}

export function parseINI(iniText: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let currentSection: Record<string, string> = {};

  const lines = iniText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.slice(1, -1).trim();
      result[sectionName] = result[sectionName] || {};
      currentSection = result[sectionName];
      continue;
    }
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      const cleanValue = value.replace(/^["']|["']$/g, '');
      currentSection[key] = cleanValue;
    }
  }
  return result;
}

export const hyTranslations = parseINI(hyIniContent);
export const enTranslations = parseINI(enIniContent);

export type Locale = 'hy' | 'en';

type I18nContextProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (section: string, key: string, fallback: string) => string;
};

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

function hexToHsl(hex: string) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function applyColorToElement(element: HTMLElement, colorStr: string | null) {
  if (!colorStr) return;
  const setVar = (name: string, val: string | number) => element.style.setProperty(name, String(val));

  if (!isNaN(Number(colorStr))) {
    setVar('--hue', colorStr);
    setVar('--primary-color', `hsl(${colorStr}, var(--primary-sat, 36%), var(--primary-lit, 23%))`);
    setVar('--text-color', `hsl(${colorStr}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    setVar('--inactive-color', `hsl(${colorStr}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
    setVar('--check-color', `hsl(${colorStr}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    return;
  }

  if (colorStr.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(colorStr)) {
    try {
      const hsl = hexToHsl(colorStr);
      setVar('--hue', hsl.h);
      setVar('--primary-color', colorStr);
      setVar('--text-color', `hsl(${hsl.h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
      setVar('--inactive-color', `hsl(${hsl.h}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
      setVar('--check-color', `hsl(${hsl.h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    } catch (e) {
      console.error("Hex parsing error", e);
    }
  } else if (colorStr.startsWith('hsl')) {
    const match = colorStr.match(/hsla?\(\s*(\d+)/);
    if (match) {
      const h = match[1];
      setVar('--hue', h);
      setVar('--primary-color', colorStr);
      setVar('--text-color', `hsl(${h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
      setVar('--inactive-color', `hsl(${h}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
      setVar('--check-color', `hsl(${h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    }
  } else {
    setVar('--primary-color', colorStr);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('hy'); // Default to Armenian
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hdesign_locale') as Locale;
    if (saved === 'en' || saved === 'hy') {
      setLocaleState(saved);
    }

    const syncTranslations = async () => {
      try {
        const res = await fetch('/api/translations');
        if (res.ok) {
          const dynamicData = await res.json();
          if (dynamicData.hy) {
            for (const section in dynamicData.hy) {
              if (!hyTranslations[section]) hyTranslations[section] = {};
              Object.assign(hyTranslations[section], dynamicData.hy[section]);
            }
          }
          if (dynamicData.en) {
            for (const section in dynamicData.en) {
              if (!enTranslations[section]) enTranslations[section] = {};
              Object.assign(enTranslations[section], dynamicData.en[section]);
            }
          }
          // trigger state update
          setLocaleState(prev => prev === 'en' ? 'en' : 'hy');
        }
      } catch (err) {
        console.warn('Failed to sync remote translations:', err);
      }
    };
    syncTranslations();

    const syncFromSupabase = async () => {
      let theme = 'light';
      let language: Locale = saved || 'hy';
      
      try {
        const remoteSettings = await fetchSettingsFromSupabase();
        if (remoteSettings) {
          if (remoteSettings.theme) theme = remoteSettings.theme;
          if (remoteSettings.language === 'en' || remoteSettings.language === 'hy') {
            language = remoteSettings.language;
          }
        } else {
          theme = localStorage.getItem('hdesign-theme') || 'light';
          const localLang = localStorage.getItem('hdesign_locale');
          if (localLang === 'en' || localLang === 'hy') {
            language = localLang;
          }
        }
      } catch (err) {
        console.warn('Failed to sync settings from Supabase, using fallback:', err);
        theme = localStorage.getItem('hdesign-theme') || 'light';
        const localLang = localStorage.getItem('hdesign_locale');
        if (localLang === 'en' || localLang === 'hy') {
          language = localLang;
        }
      }

      if (language === 'en' || language === 'hy') {
        if (language !== saved) {
          setLocaleState(language as Locale);
          localStorage.setItem('hdesign_locale', language);
        }
      }

      if (theme === 'light' || theme === 'dark' || theme === 'green') {
        const localTheme = localStorage.getItem('hdesign-theme');
        if (localTheme !== theme || !document.documentElement.getAttribute('data-theme')) {
          localStorage.setItem('hdesign-theme', theme);
          document.documentElement.setAttribute('data-theme', theme);
          document.documentElement.setAttribute('data-color', theme === 'light' ? '#083f39' : '#ffffff');
          window.dispatchEvent(new Event('hdesign-theme-change'));
        }
        document.documentElement.classList.remove('light', 'dark', 'green');
        document.documentElement.classList.add(theme);
      } else {
        const fallbackTheme = 'light';
        localStorage.setItem('hdesign-theme', fallbackTheme);
        document.documentElement.setAttribute('data-theme', fallbackTheme);
        document.documentElement.setAttribute('data-color', '#083f39');
        document.documentElement.classList.remove('light', 'dark', 'green');
        document.documentElement.classList.add(fallbackTheme);
        window.dispatchEvent(new Event('hdesign-theme-change'));
      }
    };

    const initialColor = document.documentElement.getAttribute('data-color');
    applyColorToElement(document.documentElement, initialColor);

    setMounted(true);
    syncFromSupabase();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          const attr = mutation.attributeName;
          const tagName = target.tagName.toLowerCase();
          
          if (target === document.documentElement) {
            if (attr === 'data-color') {
              const color = target.getAttribute('data-color');
              applyColorToElement(target, color);
            } else if (attr === 'data-theme') {
              const theme = target.getAttribute('data-theme');
              const color = theme === 'light' ? '#083f39' : '#ffffff';
              applyColorToElement(target, color);
            }
          } else if (tagName.startsWith('hd-')) {
            if (attr === 'data-color') {
              const color = target.getAttribute('data-color');
              applyColorToElement(target, color);
            } else if (attr === 'value') {
              const newValue = target.getAttribute('value') || '';
              if ('value' in target) {
                if ((target as any).value !== newValue) {
                  (target as any).value = newValue;
                }
              }
              const innerInput = target.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
              if (innerInput) {
                if (innerInput.value !== newValue) {
                  innerInput.value = newValue;
                  innerInput.dispatchEvent(new Event('input', { bubbles: true }));
                  innerInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
            } else if (attr === 'checked') {
              const innerCheckbox = target.querySelector('input[type="checkbox"], input[type="radio"]') as HTMLInputElement;
              if (innerCheckbox) {
                const hasChecked = target.hasAttribute('checked');
                if (innerCheckbox.checked !== hasChecked) {
                  innerCheckbox.checked = hasChecked;
                  innerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['value', 'checked', 'data-color', 'data-theme'],
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hdesign_locale', newLocale);
      const currentTheme = localStorage.getItem('hdesign-theme') || 'light';
      saveSettingsToSupabase(currentTheme, newLocale);
    }
  };

  const translations = locale === 'hy' ? hyTranslations : enTranslations;

  const t = (section: string, key: string, fallback: string): string => {
    if (translations[section] && translations[section][key]) {
      return translations[section][key];
    }
    return fallback;
  };

  return React.createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'hy' as Locale,
      setLocale: () => {},
      t: (section: string, key: string, fallback: string) => {
        // static fallback to hy
        if (hyTranslations[section] && hyTranslations[section][key]) {
          return hyTranslations[section][key];
        }
        return fallback;
      }
    };
  }
  return context;
}

// Keeping this static export for backward compatibility or simple use cases
export function t(section: string, key: string, fallback: string): string {
  if (hyTranslations[section] && hyTranslations[section][key]) {
    return hyTranslations[section][key];
  }
  return fallback;
}

export default hyTranslations;
