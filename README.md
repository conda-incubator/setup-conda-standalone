# setup-conda-standalone

[![CI](https://github.com/conda-incubator/setup-conda-standalone/actions/workflows/main.yaml/badge.svg)](https://github.com/conda-incubator/setup-conda-standalone/actions/workflows/main.yaml)

An action to set up [conda-standalone](https://github.com/conda/conda-standalone), a standalone
`conda` binary. It be used, for example,  to create `conda` environments without requiring a full
Miniconda or Miniforge installation.

The action downloads `conda-standalone` from a `conda` channel and sets the environment variable
`CONDA_EXE` to the binary location.

For a full list of input parameters, see the [action.yaml](./action.yaml) file.

## Usage examples

### Basic usage

Download the latest version of `conda-standalone` from `conda-forge` into a temporary directory.

```yaml
- uses: conda-incubator/setup-conda-standalone@main
  with:
    channel: conda-forge
    destination-directory: ${{ runner.temp }}/conda-standalone
```

### Select version

Download version `25.9.1` from `main`:

```yaml
- uses: conda-incubator/setup-conda-standalone@main
  with:
    channel: main
    conda-standalone-version: 25.9.1
    destination-directory: ${{ runner.temp }}/conda-standalone
```

### Download specific build variant

Download the latest `onedir` build for `linux-aarch64`:

```yaml
- uses: conda-incubator/setup-conda-standalone@main
  with:
    build-string: '*onedir*'
    channel: main
    platform: linux-aarch64
```
