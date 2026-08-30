; Aviso de reinstalación
;
; De fábrica, el instalador de electron-builder detecta la versión anterior y
; la reemplaza sin decir nada. Cierra KIOS si está abierto —eso sí lo avisa—,
; pero nunca le pregunta al usuario si quiere seguir.
;
; Alguien que instala de nuevo sin acordarse de que ya lo tenía se queda con
; la duda de si acaba de borrar las ventas del comercio. La respuesta es que
; no: los datos viven en %APPDATA%\kios y el instalador escribe en
; %LOCALAPPDATA%\Programs\kios. Pero eso hay que decirlo en el momento en que
; la persona se lo está preguntando, no en un documento.
;
; electron-builder toma este archivo solo, por el nombre: cualquier
; installer.nsh que esté en la carpeta build/ del proyecto de Electron se
; incluye en la compilación. Lo copia scripts/instalador-windows.php, igual
; que las imágenes.

!macro customInit
  ; initMultiUser ya corrió, así que SHELL_CONTEXT apunta a donde corresponde
  ; según la instalación sea para el usuario o para la máquina.
  ReadRegStr $0 SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" InstallLocation

  StrCmp $0 "" kios_seguir 0
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
      "Ya hay una versión de KIOS instalada en esta computadora.$\r$\n$\r$\nSi continuás, se reemplaza por esta.$\r$\n$\r$\nTus datos no se tocan: las ventas, los productos, los clientes y los usuarios quedan como están.$\r$\n$\r$\nAceptar para actualizar, Cancelar para salir." \
      /SD IDOK IDOK kios_seguir
    Quit
  kios_seguir:
!macroend
