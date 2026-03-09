# Es el ejecutable principal que llama a los otros dos que generan las BBDD de comprados y monitorizados.
# Se ejecuta asi: python3 main_excel2json.py


import subprocess
import sys

def ejecutar_script(nombre_archivo):
    print(f"--- Iniciando: {nombre_archivo} ---")
    try:
        # Ejecuta el script y espera a que termine
        subprocess.run([sys.executable, nombre_archivo], check=True)
        print(f"--- Finalizado con éxito: {nombre_archivo} ---\n")
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar {nombre_archivo}: {e}")
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {nombre_archivo}")

if __name__ == "__main__":
    # Lista de scripts a ejecutar
    scripts = [
        "comprados_excel2json.py",
        "monitorizacion_excel2json.py"
    ]
    
    for script in scripts:
        ejecutar_script(script)

