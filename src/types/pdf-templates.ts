// Tipos para el sistema de plantillas PDF

export interface TemplateMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TemplateFontSizes {
  title: number;
  subtitle: number;
  body: number;
  small: number;
}

export interface TemplateFonts {
  primary: string;
  secondary: string;
  sizes: TemplateFontSizes;
}

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  border: string;
}

export interface TemplateLayout {
  show_logo: boolean;
  logo_position: string;
  logo_size: 'small' | 'medium' | 'large';
  logo_width?: number;
  logo_height?: number;
  header_height: number;
  footer_height: number;
  table_style: string;
}

export interface TemplateBranding {
  company_name_size: number;
  show_tagline: boolean;
  custom_footer: string;
}

export interface TemplateConfig {
  id?: string;
  name: string;
  description: string;
  page_format: string;
  orientation: string;
  margins: TemplateMargins;
  fonts: TemplateFonts;
  colors: TemplateColors;
  layout: TemplateLayout;
  branding: TemplateBranding;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateListItem {
  id?: string;
  name: string;
  description: string;
  page_format: string;
  orientation: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreviewData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  customer: {
    name: string;
    document: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}
