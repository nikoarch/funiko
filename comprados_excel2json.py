# Es llamado por main_excel2json.py. Mejor usar aquel, pero si hace falta solo este se ejecuta asi: python3 comprados_excel2json.py

import pandas as pd
import json
import random
import string
from datetime import datetime

def ofuscar_serie(serie):
    if pd.isnull(serie) or str(serie).strip() == "-":
        return serie
    
    resultado = []
    for char in str(serie):
        if char.isalpha():
            if char.isupper():
                resultado.append(random.choice(string.ascii_uppercase))
            else:
                resultado.append(random.choice(string.ascii_lowercase))
        elif char.isdigit():
            resultado.append(random.choice(string.digits))
        else:
            resultado.append(char)
    return "".join(resultado)

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, pd.Timestamp)):
        return obj.strftime('%d/%m/%Y')
    return str(obj)

def excel_a_json(archivo_excel, hoja_nombre, archivo_json):
    # Leer el Excel (Fila 7 cabeceras -> header=6)
    df = pd.read_excel(archivo_excel, sheet_name=hoja_nombre, header=6)
    
    # Asegurar que franquicia sea siempre string para evitar errores de filtrado (ej. 300)
    if 'franquicia' in df.columns:
        df['franquicia'] = df['franquicia'].apply(lambda x: str(int(x)) if isinstance(x, float) and x.is_integer() else (str(x) if pd.notnull(x) else None))

    # 1. Ofuscar la columna 'nroSerie' si existe
    if 'nroSerie' in df.columns:
        df['nroSerie'] = df['nroSerie'].apply(ofuscar_serie)
    
    # 2. Convertir columna 'foto' en un ARRAY (Lista)
    if 'foto' in df.columns:
        df['foto'] = df['foto'].apply(
            lambda x: [item.strip() for item in str(x).split(',')] if pd.notnull(x) and str(x).strip() != "-" else []
        )
    
    # --- MODIFICACIÓN: Formatear precio y gastosEnvio como "0,00€" ---
    for col in ['precio', 'gastosEnvio']:
        if col in df.columns:
            df[col] = df[col].apply(
                lambda x: f"{float(x):.2f}".replace('.', ',') + "€" if pd.notnull(x) and x != "-" else "0,00€"
            )
    
    # 4. Limpiar columnas "Unnamed"
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    
    # 5. Formatear FECHAS a DD/MM/YYYY
    # Buscamos columnas que contengan "fecha" o que sean de tipo datetime
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) or "fecha" in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%d/%m/%Y')

    # 6. Eliminar filas vacías y convertir NaNs a None
    df = df.dropna(how='all')
    datos = df.where(pd.notnull(df), None).to_dict(orient="records")
    
    if 'foto' in df.columns:
        for fila in datos:
            if fila['foto'] is None: fila['foto'] = []

    with open(archivo_json, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=4, default=json_serial)

# Configuración
excel_input = "Funkos.xlsx"
hoja = "COMPRADOS"
json_output = "Funiko_BBDD.json"

# Ejecución única
excel_a_json(excel_input, hoja, json_output)
print(f"¡Éxito! El archivo {json_output} se ha generado.")
print("- Columna 'nroSerie' ofuscada (formato original mantenido con caracteres aleatorios).")
print("- Fechas formateadas y columnas vacías eliminadas.")
print(f"¡Listo! Columna 'foto' convertida en array.")
print(f"¡Éxito! Archivo {json_output} generado con precios formateados (ej. '16,55€').")

