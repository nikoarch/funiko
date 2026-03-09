# Es llamado por main_excel2json.py. Mejor usar aquel, pero si hace falta solo este se ejecuta asi: python3 monitorizacion_excel2json.py

import pandas as pd
import json

def format_precio_seguro(valor):
    if pd.isnull(valor) or valor == "-":
        return None
    try:
        num = float(valor)
        return f"{num:.2f}".replace('.', ',') + "€"
    except (ValueError, TypeError):
        return str(valor)

def format_fecha_segura(valor):
    if pd.isnull(valor):
        return None
    try:
        if hasattr(valor, 'strftime'):
            return valor.strftime('%d/%m/%Y')
        return pd.to_datetime(valor).strftime('%d/%m/%Y')
    except:
        return str(valor)

def excel_a_json(archivo_excel, hoja_nombre, archivo_json):
    df = pd.read_excel(archivo_excel, sheet_name=hoja_nombre, header=1)

    # --- NUEVO: Eliminar columnas "Unnamed" ---
    # Esto quita cualquier columna que no tenga título en el Excel
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

    # Aplicar formatos seguros
    for col in ['vistoA', 'minimoHistorico']:
        if col in df.columns:
            df[col] = df[col].apply(format_precio_seguro)
    
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) or "fecha" in col.lower():
            df[col] = df[col].apply(format_fecha_segura)

    # Limpieza de filas vacías y conversión de NaNs a None (null en JSON)
    df = df.dropna(how='all')
    datos = df.where(pd.notnull(df), None).to_dict(orient="records")

    with open(archivo_json, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=4)

# Configuración
excel_input = "Funkos.xlsx"
hoja = "MONITORIZACION"
json_output = "Monitorizacion_BBDD.json"

# Ejecución única
excel_a_json(excel_input, hoja, json_output)
print(f"¡Éxito! El archivo {json_output} se ha generado.")
print("- Fechas formateadas y columnas vacías eliminadas.")
print(f"¡Éxito! Archivo {json_output} generado con precios formateados (ej. '16,55€').")


