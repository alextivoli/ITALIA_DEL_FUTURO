from docx import Document
import pypandoc
import sys

##def convert_docx_to_html(docx_file, output_file):
##    # Read the Word document
##    doc = Document(docx_file)
##
##    # Extract text and styles from the Word document
##    html_content = ""
##    for paragraph in doc.paragraphs:
##        html_content += f"<p>{paragraph.text}</p>"
##
##    # Convert the HTML content to a standalone HTML file
##    pypandoc.convert_text(html_content, 'html', format='docx', outputfile=output_file)
##
##if __name__ == "__main__":
##    input_docx_file = "provaword.docx"
##    output_html_file = "provahtml.html"
##
##    convert_docx_to_html(input_docx_file, output_html_file)
def main():
    output = pypandoc.convert_file(sys.argv[1], 'html5', outputfile=sys.argv[2])
if __name__ == "__main__":
    main()
