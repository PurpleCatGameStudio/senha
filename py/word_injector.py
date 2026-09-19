from pathlib import Path
import ctypes
import os
import re
import shlex
import sys


BASE_DIR = (
    Path(sys.executable).resolve().parent
    if getattr(sys, "frozen", False)
    else Path(__file__).resolve().parent.parent
)

DATA_DIR = BASE_DIR / "data"

FILES = {
    "word": DATA_DIR / "words.txt",
    "words": DATA_DIR / "words.txt",
    "lexicon": DATA_DIR / "lexicon.txt"
}

ANSI_PATTERN = re.compile(r"\033\[[0-9;]*m")

BOX_WIDTH = 72


class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[36m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    MAGENTA = "\033[95m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"


def enable_ansi_support():
    if os.name != "nt":
        return

    try:
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_uint32()

        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass


def color(text, color_code):
    return f"{color_code}{text}{Colors.RESET}"


def visible_length(text):
    return len(ANSI_PATTERN.sub("", text))


def box_top(width=BOX_WIDTH):
    return color(f"╔{'═' * width}╗", Colors.CYAN)


def box_bottom(width=BOX_WIDTH):
    return color(f"╚{'═' * width}╝", Colors.CYAN)


def box_divider(width=BOX_WIDTH):
    return color(f"╠{'═' * width}╣", Colors.CYAN)


def box_line(content="", width=BOX_WIDTH, align="left"):
    padding = max(0, width - 2 - visible_length(content))

    if align == "center":
        left_padding = padding // 2
        right_padding = padding - left_padding
        body = f" {' ' * left_padding}{content}{' ' * right_padding} "
    else:
        body = f" {content}{' ' * padding} "

    return f"{color('║', Colors.CYAN)}{body}{color('║', Colors.CYAN)}"


def shorten_path(path_text, max_length):
    if len(path_text) <= max_length:
        return path_text

    parts = Path(path_text).parts

    if len(parts) <= 2:
        return path_text[: max_length - 1] + "…"

    head = parts[0]
    tail = os.sep.join(parts[-2:])
    shortened = f"{head}...{os.sep}{tail}"

    if len(shortened) <= max_length:
        return shortened

    return "..." + path_text[-(max_length - 3):]


def normalize_word(value):
    return value.strip().upper()


def load_words(path):
    if not path.exists():
        return set()

    return {
        normalize_word(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if normalize_word(line)
    }


def save_words(path, words):
    ordered_words = sorted(words)
    content = "\n".join(ordered_words)

    if content:
        content += "\n"

    path.write_text(content, encoding="utf-8")


def count_words(path):
    return len(load_words(path))


def validate_word_silent(value):
    if not value:
        return None, "Nenhuma palavra foi informada."

    word = normalize_word(value)

    if len(word) != 5:
        return None, f"{len(word)} letras (deve ter exatamente 5)"

    if not word.isascii() or not word.isalpha():
        return None, "contém caracteres inválidos"

    return word, None


def validate_word(value):
    word, error = validate_word_silent(value)

    if error:
        print_failure(f'"{normalize_word(value) or value}": {error}')

    return word


def get_target_file(target):
    normalized_target = target.lower()

    if normalized_target not in FILES:
        return None

    return FILES[normalized_target]


def print_header():
    word_count = count_words(FILES["word"])
    lexicon_count = count_words(FILES["lexicon"])

    label_prefix = "Pasta    "
    available_path_length = BOX_WIDTH - 2 - len(label_prefix)
    display_path = shorten_path(str(DATA_DIR), available_path_length)

    print()
    print(box_top())
    print(box_line(color("SENHA · WORD INJECTOR", Colors.BOLD + Colors.WHITE), align="center"))
    print(box_divider())
    print(box_line(f"{color('Pasta', Colors.GRAY)}    {display_path}"))
    print(box_line(f"{color('words', Colors.GREEN)}    {word_count:>6} palavras"))
    print(box_line(f"{color('lexicon', Colors.BLUE)}  {lexicon_count:>6} palavras"))
    print(box_bottom())
    print()
    print(color('Digite "help" para ver todos os comandos.', Colors.GRAY))
    print()


def print_section_title(title, color_code):
    print()
    print(color(f"── {title} ", color_code + Colors.BOLD) + color("─" * max(0, BOX_WIDTH - len(title) - 3), Colors.DIM))


def print_command(usage, description):
    print(f"  {color(usage, Colors.WHITE + Colors.BOLD)}")
    print(f"      {color(description, Colors.GRAY)}")


def print_help():
    print_section_title("ADICIONAR", Colors.GREEN)
    print_command('add word "PALAVRA1" "PALAVRA2" ...', "Adiciona uma ou mais palavras ao words.txt.")
    print()
    print_command('add lexicon "PALAVRA1" "PALAVRA2" ...', "Adiciona uma ou mais palavras ao lexicon.txt.")

    print_section_title("REMOVER", Colors.RED)
    print_command('remove word "PALAVRA1" "PALAVRA2"', "Remove uma ou mais palavras do words.txt.")
    print()
    print_command('remove lexicon "PALAVRA1" "PALAVRA2" ...', "Remove uma ou mais palavras do lexicon.txt.")

    print_section_title("VERIFICAR", Colors.YELLOW)
    print_command('check "PALAVRA1" "PALAVRA2" ...', "Verifica se as palavras existem no words.txt, lexicon.txt ou nos dois.")

    print_section_title("UTILITÁRIOS", Colors.CYAN)
    print_command("status", "Mostra a quantidade atual de palavras em cada lista.")
    print()
    print_command("clear", "Limpa o terminal.")
    print()
    print_command("help", "Mostra esta ajuda.")
    print()
    print_command("exit", "Fecha o Word Injector.")

    print_section_title("REGRAS", Colors.WHITE)
    print(f"  {color('•', Colors.DIM)} Todas as palavras devem ter exatamente 5 letras.")
    print(f"  {color('•', Colors.DIM)} Maiúsculas e minúsculas são normalizadas automaticamente.")
    print(f"  {color('•', Colors.DIM)} Duplicatas não são permitidas.")
    print(f"  {color('•', Colors.DIM)} As listas são mantidas em ordem alfabética.")
    print()


def render_ratio_bar(word_count, lexicon_count, width=40):
    total = word_count + lexicon_count

    if total == 0:
        return color("─" * width, Colors.DIM)

    word_fill = round((word_count / total) * width)
    lexicon_fill = width - word_fill

    return color("█" * word_fill, Colors.GREEN) + color("█" * lexicon_fill, Colors.BLUE)


def print_status():
    word_count = count_words(FILES["word"])
    lexicon_count = count_words(FILES["lexicon"])
    total_count = word_count + lexicon_count

    print()
    print(box_top())
    print(box_line(color("STATUS DAS LISTAS", Colors.BOLD + Colors.WHITE), align="center"))
    print(box_divider())
    print(box_line(f"{color('words.txt', Colors.GREEN):<28}{color(f'{word_count:,}', Colors.WHITE):>10}"))
    print(box_line(f"{color('lexicon.txt', Colors.BLUE):<28}{color(f'{lexicon_count:,}', Colors.WHITE):>10}"))
    print(box_line(f"{color('total', Colors.GRAY):<28}{color(f'{total_count:,}', Colors.WHITE):>10}"))
    print(box_divider())
    print(box_line(render_ratio_bar(word_count, lexicon_count), align="center"))
    print(box_bottom())
    print()


def print_success(message):
    print(f"{color('✓', Colors.GREEN + Colors.BOLD)} {message}")


def print_failure(message):
    print(f"{color('✗', Colors.RED + Colors.BOLD)} {message}")


def print_info(message):
    print(f"{color('ℹ', Colors.CYAN + Colors.BOLD)} {message}")


def add_words(target, raw_values):
    path = get_target_file(target)

    if path is None:
        print_failure('Destino inválido. Use "word" ou "lexicon".')
        return

    words = load_words(path)
    added = []
    skipped = []
    invalid_count = 0

    for raw_value in raw_values:
        word = validate_word(raw_value)

        if word is None:
            invalid_count += 1
            continue

        if word in words:
            skipped.append(word)
            continue

        words.add(word)
        added.append(word)

    if added:
        save_words(path, words)

    print()

    for word in added:
        print_success(f'"{word}" adicionada a {path.name}.')

    for word in skipped:
        print_failure(f'"{word}" já existe em {path.name}.')

    print_info(
        f"{len(added)} adicionada(s), {len(skipped)} duplicada(s), "
        f"{invalid_count} inválida(s) de {len(raw_values)} informada(s)."
    )
    print()


def remove_words(target, raw_values):
    path = get_target_file(target)

    if path is None:
        print_failure('Destino inválido. Use "word" ou "lexicon".')
        return

    words = load_words(path)
    removed = []
    skipped = []
    invalid_count = 0

    for raw_value in raw_values:
        word = validate_word(raw_value)

        if word is None:
            invalid_count += 1
            continue

        if word not in words:
            skipped.append(word)
            continue

        words.remove(word)
        removed.append(word)

    if removed:
        save_words(path, words)

    print()

    for word in removed:
        print_success(f'"{word}" removida de {path.name}.')

    for word in skipped:
        print_failure(f'"{word}" não existe em {path.name}.')

    print_info(
        f"{len(removed)} removida(s), {len(skipped)} não encontrada(s), "
        f"{invalid_count} inválida(s) de {len(raw_values)} informada(s)."
    )
    print()


def check_words(raw_values):
    word_set = load_words(FILES["word"])
    lexicon_set = load_words(FILES["lexicon"])

    invalid_entries = []
    not_found_entries = []
    found_entries = []

    for raw_value in raw_values:
        word, error = validate_word_silent(raw_value)

        if error:
            invalid_entries.append((raw_value, error))
            continue

        found_in = []

        if word in lexicon_set:
            found_in.append(FILES["lexicon"].name)

        if word in word_set:
            found_in.append(FILES["word"].name)

        if not found_in:
            not_found_entries.append(word)
        else:
            found_entries.append((word, found_in))

    print()

    if invalid_entries:
        print_section_title(f"INVÁLIDAS ({len(invalid_entries)})", Colors.RED)
        for raw_value, error in invalid_entries:
            print(f"  {color('✗', Colors.RED)} \"{raw_value}\" — {error}")

    if not_found_entries:
        print_section_title(f"NÃO ENCONTRADAS ({len(not_found_entries)})", Colors.YELLOW)
        for word in not_found_entries:
            print(f"  {color('✗', Colors.YELLOW)} {word}")

    if found_entries:
        print_section_title(f"ENCONTRADAS ({len(found_entries)})", Colors.GREEN)
        for word, found_in in found_entries:
            files_label = ", ".join(color(name, Colors.GREEN) for name in found_in)
            print(f"  {color('✓', Colors.GREEN)} {color(word, Colors.BOLD + Colors.WHITE)} → {files_label}")

    print()
    print_info(
        f"{len(found_entries)} encontrada(s), {len(not_found_entries)} não encontrada(s), "
        f"{len(invalid_entries)} inválida(s) de {len(raw_values)} informada(s)."
    )
    print()


def clear_terminal():
    os.system("cls" if os.name == "nt" else "clear")


def process_command(parts):
    if not parts:
        return True

    command = parts[0].lower()

    if command == "help":
        print_help()
        return True

    if command == "status":
        print_status()
        return True

    if command == "clear":
        clear_terminal()
        print_header()
        return True

    if command == "exit":
        return False

    if command == "check":
        if len(parts) < 2:
            print_failure('Use: check "PALAVRA1" ["PALAVRA2" ...]')
            return True

        check_words(parts[1:])
        return True

    if command in ("add", "remove"):
        if len(parts) < 3:
            print_failure(
                f'Use: {command} word "PALAVRA1" ["PALAVRA2" ...] ou {command} lexicon "PALAVRA1" [...]'
            )
            return True

        target = parts[1].lower()
        raw_words = parts[2:]

        if command == "add":
            add_words(target, raw_words)
        else:
            remove_words(target, raw_words)

        return True

    print_failure(f'Comando "{command}" não reconhecido. Digite "help".')
    return True


def main():
    enable_ansi_support()

    if not DATA_DIR.exists():
        print_failure(f"Pasta data não encontrada: {DATA_DIR}")
        input("\nPressione Enter para fechar...")
        return

    if len(sys.argv) > 1:
        process_command(sys.argv[1:])
        return

    print_header()

    while True:
        try:
            prompt = color("❯", Colors.MAGENTA + Colors.BOLD) + " "
            command_line = input(prompt).strip()

            if not command_line:
                continue

            try:
                parts = shlex.split(command_line)
            except ValueError:
                print_failure("Aspas inválidas no comando.")
                continue

            if not process_command(parts):
                print()
                print(color("Word Injector encerrado.", Colors.GRAY))
                break

        except KeyboardInterrupt:
            print()
            print(color("Word Injector encerrado.", Colors.GRAY))
            break
        except EOFError:
            print()
            break


if __name__ == "__main__":
    main()